// ==UserScript==
// @name         GeoFS Excrafts
// @version      2.0
// @description  Adds custom aircraft to GeoFS from geofs-excrafts
// @author       747400forlife
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById("excrafts-button")) return;

    const DATA_URL = "https://raw.githubusercontent.com/747400forlife/geofs-excrafts/main/vehicles.json";

    const aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
    if (!aircraftButton) return;

    // 1. Clean Toolbar Button
    const excraftsButton = aircraftButton.cloneNode(true);
    excraftsButton.textContent = "EXCRAFTS";
    excraftsButton.removeAttribute("data-toggle-panel");
    excraftsButton.setAttribute("data-toggle-panel", ".geofs-excrafts-list");
    excraftsButton.id = "excrafts-button";
    
    aircraftButton.parentNode.insertBefore(excraftsButton, aircraftButton.nextSibling);

    // 2. Panel without logos/images
    const excraftsPanel = document.createElement("ul");
    excraftsPanel.className = "geofs-list geofs-excrafts-list geofs-toggle-panel";

    excraftsPanel.innerHTML = `
        <div style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h4 style="margin: 0; font-size: 16px;">GeoFS Excrafts</h4>
        </div>
    `;

    const aircraftPanel = document.querySelector(".geofs-aircraft-list");
    if (aircraftPanel && aircraftPanel.parentNode) {
        aircraftPanel.parentNode.insertBefore(excraftsPanel, aircraftPanel.nextSibling);
    }

    function createCategorySection(title, items) {
        const category = document.createElement("li");
        category.className = "geofs-list-collapsible-item";
        category.textContent = title;

        const sublist = document.createElement("ul");
        sublist.className = "geofs-collapsible";

        items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        items.forEach(item => {
            const li = document.createElement("li");
            li.setAttribute("data-url", item.url);
            li.setAttribute("data-mpid", item.mpid);
            if (item.mp === "addon" && item.mpid) { 
                li.setAttribute("data-broadcast-id", item.mpid); 
            }

            const itemContent = document.createElement("span");
            itemContent.textContent = item.name;

            if (item.mp === "addon") {
                geofs.aircraftList[item.mpid] = {
                    id: item.mpid,
                    community: 1,
                    multiplayerFiles: "",
                    name: item.name,
                    path: item.url
                };
            }

            li.appendChild(itemContent);
            sublist.appendChild(li);
        });

        category.appendChild(sublist);
        return category;
    }

    function loadAircraftFromUrl(baseUrl, mpID, name, broadcastId) {
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }

        $.ajax(baseUrl + "aircraft.json", {
            dataType: "text",
            success: function (jsonText) {
                var customRecord = {
                    id: mpID,
                    name: name,
                    fullPath: baseUrl,
                    isPremium: false,
                    isCommunity: false,
                    definition: btoa(jsonText),
                    multiplayerFiles: [
                        baseUrl + "airbus_a310_mrtt.glb"
                    ]
                };

                var parsedDefinition = geofs.aircraft.instance.parseRecord(JSON.stringify(customRecord));

                if (parsedDefinition) {
                    geofs.aircraft.instance.unloadAircraft();
                    geofs.aircraft.instance.fullPath = customRecord.fullPath;
                    geofs.aircraft.instance.aircraftRecord = customRecord;
                    geofs.aircraft.instance.init(parsedDefinition, geofs.aircraft.instance.getCurrentCoordinates());

                    geofs.aircraft.instance.geofsExtrasBroadcastId = broadcastId || null;
                    geofs.aircraft.instance.geofsExtrasBroadcastOwnerId = broadcastId ? mpID : null;
                } else {
                    if (window.ui && ui.notification) ui.notification.show("Failed to parse aircraft.json");
                }
            },
            error: function () {
                if (window.ui && ui.notification) ui.notification.show("Could not load aircraft.json from " + baseUrl);
            }
        });
    }

    excraftsPanel.addEventListener("click", function (e) {
        const li = e.target.closest("li[data-url]");
        if (li) {
            const url = li.getAttribute("data-url");
            const mpID = li.getAttribute("data-mpid");
            const broadcastId = li.getAttribute("data-broadcast-id");
            const name = li.textContent || li.innerText;
            loadAircraftFromUrl(url, mpID, name, broadcastId);
        }
    });

    fetch(DATA_URL)
        .then(response => response.json())
        .then(data => {
            for (const [category, items] of Object.entries(data)) {
                const section = createCategorySection(category, items);
                excraftsPanel.appendChild(section);
            }
        })
        .catch(error => {
            console.warn("Could not fetch remote vehicles.json, loading fallback list.");
            const fallbackData = {
                "Airliners": [
                    {
                        name: "Airbus A310 MRTT",
                        url: "https://raw.githubusercontent.com/747400forlife/geofs-excrafts/main/a310/",
                        mpid: "1024",
                        mp: "addon"
                    }
                ]
            };
            for (const [category, items] of Object.entries(fallbackData)) {
                const section = createCategorySection(category, items);
                excraftsPanel.appendChild(section);
            }
        });

})();
