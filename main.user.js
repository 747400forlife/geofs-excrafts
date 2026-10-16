// ==UserScript==
// @name         GeoFS Excrafts
// @version      1.2
// @description  Adds custom aircraft to GeoFS from geofs-excrafts
// @author       747400forlife
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function initExcrafts() {
        // Prevent duplicate injection if script runs twice
        if (document.getElementById("excrafts-button")) return;

        const aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
        if (!aircraftButton) return;

        // 1. Create Clean Bottom Bar Button
        const excraftsButton = document.createElement("button");
        excraftsButton.id = "excrafts-button";
        excraftsButton.className = "mdl-button mdl-js-button geofs-f-o";
        excraftsButton.setAttribute("data-toggle-panel", ".geofs-excrafts-list");
        excraftsButton.textContent = "EXCRAFTS";
        excraftsButton.style.padding = "0 10px";

        aircraftButton.parentNode.insertBefore(excraftsButton, aircraftButton.nextSibling);

        // 2. Create Panel Container
        const extrasPanel = document.createElement("ul");
        extrasPanel.className = "geofs-list geofs-excrafts-list geofs-toggle-panel";
        extrasPanel.style.display = "none";

        // Panel Title (Only visible inside the opened menu)
        const headerLi = document.createElement("li");
        headerLi.innerHTML = `<h4 style="margin: 10px 0 10px 20px;">GeoFS Excrafts</h4>`;
        extrasPanel.appendChild(headerLi);

        const aircraftPanel = document.querySelector(".geofs-aircraft-list");
        if (aircraftPanel && aircraftPanel.parentNode) {
            aircraftPanel.parentNode.insertBefore(extrasPanel, aircraftPanel.nextSibling);
        }

        // 3. Helper to Build Category & Subitems
        function createCategorySection(title, items) {
            const category = document.createElement("li");
            category.className = "geofs-list-collapsible-item";
            category.textContent = title;

            const sublist = document.createElement("ul");
            sublist.className = "geofs-collapsible";

            items.forEach(item => {
                const li = document.createElement("li");
                li.setAttribute("data-url", item.url);
                li.setAttribute("data-mpid", item.mpid);

                const itemContent = document.createElement("span");
                itemContent.textContent = item.name;

                if (window.geofs && geofs.aircraftList) {
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

        // 4. Load Function (Parses physics JSON & .glb)
        function loadAircraftFromUrl(baseUrl, mpID, name) {
            if (typeof $ === "undefined") return;

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
                        multiplayerFiles: [baseUrl + "airbus_a310_mrtt.glb"]
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
                },
                error: function () {
                    if (window.ui && ui.notification) ui.notification.show("Could not load aircraft.json");
                }
            });
        }

        // 5. Click Handler for Menu Items
        extrasPanel.addEventListener("click", function (e) {
            const li = e.target.closest("li[data-url]");
            if (li) {
                const url = li.getAttribute("data-url");
                const mpID = li.getAttribute("data-mpid");
                const name = li.textContent || li.innerText;
                loadAircraftFromUrl(url, mpID, name);
            }
        });

        // 6. Populate Local List
        const localData = {
            "Airliners": [
                {
                    name: "Airbus A310 MRTT",
                    url: "https://raw.githubusercontent.com/747400forlife/geofs-excrafts/main/a310/",
                    mpid: "1024"
                }
            ]
        };

        for (const [category, items] of Object.entries(localData)) {
            const section = createCategorySection(category, items);
            extrasPanel.appendChild(section);
        }
    }

    // Wait until GeoFS UI element is fully loaded before building the menu
    const checkInterval = setInterval(() => {
        if (document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]')) {
            clearInterval(checkInterval);
            initExcrafts();
        }
    }, 1000);

})();
