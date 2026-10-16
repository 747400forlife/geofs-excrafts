// ==UserScript==
// @name         GeoFS Excrafts
// @version      2.1
// @description  Adds custom aircraft to GeoFS from geofs-excrafts
// @author       747400forlife
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function initExcrafts() {
        // Purge any lingering UI elements from old scripts
        const oldLogos = document.querySelectorAll('img[src*="JXT"], .geofs-extras-list');
        oldLogos.forEach(el => el.remove());

        if (document.getElementById("excrafts-button")) return;

        const aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
        if (!aircraftButton) return;

        // 1. Create clean, isolated button
        const excraftsButton = aircraftButton.cloneNode(true);
        excraftsButton.textContent = "EXCRAFTS";
        excraftsButton.removeAttribute("data-toggle-panel");
        excraftsButton.setAttribute("data-toggle-panel", ".geofs-excrafts-list");
        excraftsButton.id = "excrafts-button";

        aircraftButton.parentNode.insertBefore(excraftsButton, aircraftButton.nextSibling);

        // 2. Create popup panel without any images/logos
        const excraftsPanel = document.createElement("ul");
        excraftsPanel.className = "geofs-list geofs-excrafts-list geofs-toggle-panel";
        excraftsPanel.style.display = "none";

        excraftsPanel.innerHTML = `
            <div style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h4 style="margin: 0; font-size: 16px; color: #fff;">GeoFS Excrafts</h4>
            </div>
        `;

        const aircraftPanel = document.querySelector(".geofs-aircraft-list");
        if (aircraftPanel && aircraftPanel.parentNode) {
            aircraftPanel.parentNode.insertBefore(excraftsPanel, aircraftPanel.nextSibling);
        }

        // 3. Aircraft Loader Function
        function loadAircraftFromUrl(baseUrl, mpID, name) {
            if (!baseUrl.endsWith("/")) baseUrl += "/";

            const aircraftJsonUrl = baseUrl + "aircraft.json";
            const modelGlbUrl = baseUrl + "airbus_a310_mrtt.glb";

            fetch(aircraftJsonUrl)
                .then(response => {
                    if (!response.ok) throw new Error("HTTP error " + response.status);
                    return response.text();
                })
                .then(jsonText => {
                    var customRecord = {
                        id: mpID,
                        name: name,
                        fullPath: baseUrl,
                        isPremium: false,
                        isCommunity: false,
                        definition: btoa(jsonText),
                        multiplayerFiles: [modelGlbUrl]
                    };

                    var parsedDefinition = geofs.aircraft.instance.parseRecord(JSON.stringify(customRecord));

                    if (parsedDefinition) {
                        geofs.aircraft.instance.unloadAircraft();
                        geofs.aircraft.instance.fullPath = customRecord.fullPath;
                        geofs.aircraft.instance.aircraftRecord = customRecord;
                        geofs.aircraft.instance.init(parsedDefinition, geofs.aircraft.instance.getCurrentCoordinates());

                        if (window.ui && ui.notification) {
                            ui.notification.show("Loaded " + name);
                        }
                    } else {
                        if (window.ui && ui.notification) ui.notification.show("Failed to parse aircraft.json");
                    }
                })
                .catch(err => {
                    console.error(err);
                    if (window.ui && ui.notification) {
                        ui.notification.show("Could not load aircraft.json from GitHub");
                    }
                });
        }

        // 4. Populate Local Menu Entry
        const categoryLi = document.createElement("li");
        categoryLi.className = "geofs-list-collapsible-item";
        categoryLi.textContent = "Airliners";

        const sublist = document.createElement("ul");
        sublist.className = "geofs-collapsible";

        const itemLi = document.createElement("li");
        itemLi.setAttribute("data-url", "https://raw.githubusercontent.com/747400forlife/geofs-excrafts/main/a310/");
        itemLi.setAttribute("data-mpid", "1024");

        const span = document.createElement("span");
        span.textContent = "Airbus A310 MRTT";
        itemLi.appendChild(span);

        itemLi.addEventListener("click", function (e) {
            e.stopPropagation();
            loadAircraftFromUrl(
                "https://raw.githubusercontent.com/747400forlife/geofs-excrafts/main/a310/",
                "1024",
                "Airbus A310 MRTT"
            );
        });

        sublist.appendChild(itemLi);
        categoryLi.appendChild(sublist);
        excraftsPanel.appendChild(categoryLi);
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]')) {
            clearInterval(checkInterval);
            initExcrafts();
        }
    }, 1000);

})();
