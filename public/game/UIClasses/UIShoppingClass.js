import { MachineClient } from '../global.js';

let i = false;

document.addEventListener('DOMContentLoaded', () => {
    if (i === false) {
        SetupShopUINavigation();
        SetupPushShips();
        SetShopItems();

        const ShopCT = document.querySelector(".shop-wrapper");

        document.getElementById("ShopBTN").addEventListener("click", () => {
            if (ShopCT.style.display === "block") {
                ShopCT.style.display = "none";
            } else {
                ShopCT.style.display = "block";
            }
        });

        document.getElementById('ShopCloseBTN').onclick = () => {
            ShopCT.style.display = "none";
        }

        i = true;
    };
});
function SetupPushShips() {
    const rafts = [
        { id: 1, name: "Raft 1", class: "Starter Raft", health: 100, maxCrew: 1, cargo: 10, speed: 9, price: "50 Gold", img: "./assets/icons/ships/t1.png" },
        { id: 2, name: "Raft 2", class: "Explorer Raft", health: 200, maxCrew: 2, cargo: 30, speed: 8.8, price: "2.5K Gold", img: "./assets/icons/ships/t1.png" },
        { id: 3, name: "Raft 3", class: "Large Raft", health: 350, maxCrew: 4, cargo: 60, speed: 8.6, price: "8K Gold", img: "./assets/icons/ships/t1.png" }
    ];

    const boats = [
        { id: 4, name: "Boat 1", class: "Boat 1", health: 800, maxCrew: 6, cargo: 200, speed: 8, price: "15K Gold", img: "./assets/icons/ships/t4.png" },
        { id: 5, name: "Boat 2", class: "Boat 2", health: 1250, maxCrew: 8, cargo: 400, speed: 7.8, price: "30K Gold", img: "./assets/icons/ships/t4.png" },
        { id: 6, name: "Boat 3", class: "Boat 3", health: 1600, maxCrew: 10, cargo: 600, speed: 7.6, price: "45K Gold", img: "./assets/icons/ships/t4.png" }
    ];

    const carousel = document.querySelector(".ship-carousel");
    carousel.innerHTML = "";

    // Create 2-column layout
    const wrapper = document.createElement("div");
    wrapper.className = "grid grid-cols-1 md:grid-cols-2 gap-4 w-full";

    // Left column = RAFTS
    const leftCol = document.createElement("div");
    leftCol.className = "flex flex-col gap-3";

    // Right column = BOATS
    const rightCol = document.createElement("div");
    rightCol.className = "flex flex-col gap-3";

    // Function to create each card
    const createShipCard = (ship) => {
        const row = document.createElement("div");

        row.className =
            "w-full border border-gray-600 rounded-sm px-3 py-3 " +
            "flex items-center justify-between text-white gap-3 " +
            "hover:border-gray-300 transition";

        row.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <img src="${ship.img}" class="w-14 h-14 object-contain" />

                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">${ship.name}</div>
                    <div class="text-xs text-gray-300 truncate">${ship.class}</div>

                    <div class="flex items-center gap-3 text-xs text-gray-200 mt-1">

                        <span class="flex items-center gap-1">
                            <i data-lucide="shield" class="w-3 h-3"></i> ${ship.health}
                        </span>

                        <span class="flex items-center gap-1">
                            <i data-lucide="users" class="w-3 h-3"></i> ${ship.maxCrew}
                        </span>

                        <span class="flex items-center gap-1">
                            <i data-lucide="box" class="w-3 h-3"></i> ${ship.cargo}
                        </span>

                        <span class="flex items-center gap-1">
                            <i data-lucide="gauge" class="w-3 h-3"></i> ${ship.speed}
                        </span>

                    </div>
                </div>
            </div>

            <div class="flex flex-col items-end">
                <span class="text-sm font-semibold whitespace-nowrap">${ship.price}</span>

                <button 
                    class="buy-btn mt-1 px-3 py-1 border border-blue-400 text-white rounded-sm text-xs hover:bg-blue-800/30 transition"
                    data-ship-id="${ship.id}">
                    Buy
                </button>
            </div>
        `;

        return row;
    };

    // Fill RAFTS on the LEFT
    rafts.forEach(ship => leftCol.appendChild(createShipCard(ship)));

    // Fill BOATS on the RIGHT
    boats.forEach(ship => rightCol.appendChild(createShipCard(ship)));

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);

    carousel.appendChild(wrapper);

    carousel.querySelectorAll(".buy-btn").forEach(btn => {
        btn.onclick = () => {
            const shipId = parseInt(btn.dataset.shipId);
            if (MachineClient?.ClientNetPeer?.connected) {
                MachineClient.ClientNetPeer.emit("s_b", { page: 1, item: shipId });
            }
        };
    });

    if (window.lucide) lucide.createIcons();
}


function SetupShopUINavigation() {
    const tabs = document.querySelectorAll('.nav-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.id === target);
            });
        });
    });

    document.querySelector('.nav-btn.active').click();
}

let SpoofTimeout;

export function ThrowShopError(msg, duration = 3000) {
    const ShopErrEl = document.getElementById("ShopError");

    ShopErrEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${msg}`;
    ShopErrEl.style.display = "block";

    if (SpoofTimeout) clearTimeout(SpoofTimeout);

    setTimeout(() => ShopErrEl.classList.add("show"), 10);

    SpoofTimeout = setTimeout(() => {
        ShopErrEl.classList.remove("show");

        setTimeout(() => {
            ShopErrEl.style.display = "none";
            SpoofTimeout = null;
        }, 400);
    }, duration);
}

export function OwnedShipBtnUpdates(ShipID) {
    const BuyBTN = document.querySelector(`.buy-btn[data-ship-id="${ShipID}"]`);
    if (!BuyBTN) return;

    let BtnCT = BuyBTN.closest(".btn-container");
    if (!BtnCT) {
        BtnCT = document.createElement("div");
        BtnCT.classList.add("btn-container");
        BuyBTN.parentElement.appendChild(BtnCT);
        BtnCT.appendChild(BuyBTN);
    }

    BuyBTN.textContent = "Equip";

    let SellBTN = BtnCT.querySelector(".sell-btn");
    if (!SellBTN) {
        SellBTN = document.createElement("button");
        SellBTN.classList.add("sell-btn");
        SellBTN.textContent = "Sell";
        BtnCT.appendChild(SellBTN);
    }

    BuyBTN.onclick = null;
    SellBTN.onclick = null;

    BuyBTN.onclick = () => {
        if (BuyBTN.textContent === "Equip" && MachineClient?.ClientNetPeer?.connected) {
            MachineClient.ClientNetPeer.emit("s_e", { page: 1, item: ShipID });
        }
    };

    SellBTN.onclick = () => {
        if (MachineClient?.ClientNetPeer?.connected) {
            MachineClient.ClientNetPeer.emit("s_sell", { page: 1, item: ShipID });
        }
    };
}

export function SoldShipBtnUpdates(ShipID) {
    const BuyBTN = document.querySelector(`.buy-btn[data-ship-id="${ShipID}"]`);
    if (!BuyBTN) return;

    BuyBTN.textContent = "Buy";

    if (BuyBTN.closest(".btn-container")) {
        const SellBTN = BuyBTN.closest(".btn-container").querySelector(".sell-btn");
        if (SellBTN) SellBTN.remove();
    }

    BuyBTN.onclick = null;
    BuyBTN.onclick = () => {
        if (MachineClient?.ClientNetPeer?.connected) {
            MachineClient.ClientNetPeer.emit("s_b", { page: 1, item: ShipID });
        }
    };
}


const items = [
    { id: 1, name: 'Fishing Rod', description: 'Use this trusty rod to catch fish and rare loot from water sources.', price: '500' },
    { id: 2, name: 'Cannon', description: 'Heavy damage on impact, useful against creatures or enemies.', price: '500' },
    { id: 3, name: 'Salt Pump', description: 'Salt-to-gold converter pump. Can be installed offshore.', price: '8000' },
];

function SetShopItems() {
    const tbody = document.querySelector('#items tbody');
    tbody.innerHTML = ''; // clear existing rows

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-cyan-500/10 transition';
        tr.dataset.id = item.id; // store item id

        tr.innerHTML = `
            <td class="py-2 px-4 font-medium whitespace-nowrap">${item.name}</td>
            <td class="py-2 px-4 break-words">${item.description}</td>
            <td class="py-2 px-4 text-right font-semibold whitespace-nowrap">${Number(item.price).toLocaleString('en-US')}</td>
            <td class="py-2 px-4 text-center whitespace-nowrap">
                <button class="buy-btn px-3 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 text-sm text-cyan-900 font-semibold transition">
                    Buy
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const itemId = tr.dataset.id;
            const item = items.find(i => i.id == itemId);
            MachineClient.ClientNetPeer.emit('s_b', {
                page: 2,
                item: item.id
            })
        });
    });
}
