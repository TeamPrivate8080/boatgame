import { ValueFormatter } from "../math.js";

export function SetupLeaderboardClass(socket) {
    let TopPlrs = [];
    let TopFleets = [];

    const LeaderboardUL = document.querySelector("#leaderboard-list");
    const FleetsLabel = document.querySelector(".active-fleets");

    const tabFleets = document.getElementById("tg-fleets");
    const tabUsers = document.getElementById("tg-users");
    const ToggleBtns = [tabFleets, tabUsers];

    const state = { activeTab: "fleets" };

    const render = (data) => {
        LeaderboardUL.innerHTML = "";

        if (!data || data.length === 0) {
            LeaderboardUL.innerHTML =
                `<li class="text-center text-gray-400 py-2 text-sm">No data available</li>`;
            return;
        }

        data.forEach((item) => {
            const clan = Array.isArray(item.clan)
                ? item.clan.join(", ")
                : item.clan || "-";

            const name = item.name || item.FName || "Unknown";
            const gold = ValueFormatter(item.gold || item.TGold || 0);

            LeaderboardUL.innerHTML += `
            <li class="flex justify-between items-center px-2 py-1 rounded-md hover:bg-zinc-800/50 transition-all">
              <span class="w-16 font-semibold truncate">${clan}</span>
              <span class="flex-1 text-center font-medium truncate">${name}</span>
              <span class="w-12 text-right font-bold text-amber-300">${gold}</span>
            </li>`;
        });
    };

    // TAB SWITCHING
    ToggleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            ToggleBtns.forEach((b) =>
                b.classList.remove("bg-zinc-700", "text-white", "shadow-inner")
            );

            btn.classList.add("bg-zinc-700", "text-white", "shadow-inner");

            state.activeTab = btn.dataset.type;

            render(state.activeTab === "fleets" ? TopFleets : TopPlrs);
        });
    });

    // REFRESH DATA
    socket.on("leadscores", (data) => {
        TopPlrs = data.TPlayers || [];
        TopFleets = data.TFleets || [];

        if (FleetsLabel) {
            FleetsLabel.textContent = `${TopFleets.length} Active Fleets`;
        }

        render(state.activeTab === "fleets" ? TopFleets : TopPlrs);
    });

    // Default to Fleets
    tabFleets.classList.add("bg-zinc-700", "text-white", "shadow-inner");
}

const leaderboard = document.getElementById("leaderboard");
const leaderboardToggle = document.getElementById("leaderboard-toggle");
const leaderboardArrow = document.getElementById("leaderboard-arrow");

let leaderboardOpen = false;

leaderboardToggle.addEventListener("click", () => {
    leaderboardOpen = !leaderboardOpen;

    if (leaderboardOpen) {
        leaderboard.classList.remove("translate-x-[calc(100%-2.2rem)]", "opacity-90");
        leaderboard.classList.add("translate-x-0", "opacity-100");
        leaderboardArrow.setAttribute("data-lucide", "chevron-right");
    } else {
        leaderboard.classList.add("translate-x-[calc(100%-2.2rem)]", "opacity-90");
        leaderboard.classList.remove("translate-x-0", "opacity-100");
        leaderboardArrow.setAttribute("data-lucide", "chevron-left");
    }

    if (window.lucide) lucide.createIcons();
});
