const directions = ["N","NW","W","SW","S","SE","E","NE"];

const MarkerCT = document.getElementById("marker-container");

MarkerCT.innerHTML = "";

const DegreePMar = 45;

directions.forEach((dir, i) => {
    const marker = document.createElement("div");
    marker.className = "marker";

    const span = document.createElement("span");
    span.textContent = dir;
    marker.appendChild(span);

    for (let t = -1; t <= 1; t += 2) {
        const tick = document.createElement("div");
        tick.className = "coordtick";
        tick.style.left = t === -1 ? "15%" : "85%";
        marker.appendChild(tick);

        const TickCValue = document.createElement("div");
        TickCValue.className = "tick-value";
        let val = i * DegreePMar + t * (DegreePMar / 3);
        val = (val + 360) % 360;
        TickCValue.textContent = Math.round(val);
        TickCValue.style.left = t === -1 ? "15%" : "85%";
        marker.appendChild(TickCValue);
    }

    MarkerCT.appendChild(marker);
});

MarkerCT.innerHTML += MarkerCT.innerHTML + MarkerCT.innerHTML;

export function UpdateCompass(yaw) {
    let deg = yaw * 180 / Math.PI;
    deg = (deg + 360) % 360;
    deg = (deg + 225) % 360; // aligns yaw to minimap orientation
    MarkerCT.style.left = `${-deg * 60 / DegreePMar - 60 * directions.length}px`;
}
