// ==UserScript==
// @name         GeoFS Excrafts
// @version      1.3
// @description  Adds custom aircraft to GeoFS from geofs-excrafts
// @author       747400forlife
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function initExcrafts() {
        if (document.getElementById("excrafts-button")) return;

        const aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
        if (!aircraftButton) return;

        // 1. Create bottom bar button
        const excraftsButton = document.createElement("button");
        excraftsButton.id = "excrafts-button";
        excraftsButton.className = "mdl-button mdl-js-button geofs-f-o";
        excraftsButton.setAttribute("data-toggle-panel", ".geofs-excrafts-list");
        excraftsButton.textContent = "EXCRAFTS";
        excraftsButton.style.padding = "0 10px";

        aircraftButton.parentNode.insertBefore(excraftsButton, aircraftButton.nextSibling);

        // 2. Create list panel
        const extrasPanel = document.createElement("ul");
        extrasPanel.className = "geofs-list geofs-excrafts-list geofs-toggle-panel";
        extrasPanel.style.display = "none";

        const aircraftPanel = document.querySelector(".geofs-aircraft-list");
        if (aircraftPanel && aircraftPanel.parentNode) {
            aircraftPanel.parentNode.insertBefore(extrasPanel, aircraftPanel.nextSibling);
        }

        // 3. Build expandable category items
        function createCategorySection(title, items) {
            const category = document.createElement("li");
            category.className = "geofs-list-collapsible-item";
            category.innerHTML = `<span style="cursor:pointer; font-weight:bold;">${title}</span>`;

            const sublist = document.createElement("ul");
            sublist.className = "geofs-collapsible";
            sublist.style.display = "block"; // Keep expanded by default

            items.forEach(item => {
                const li = document.createElement("li");
                li.setAttribute("data-url", item.url);
                li.setAttribute("data-mpid", item.mpid);
                li.style.cursor = "pointer";
                li.style.padding = "5px 15px";

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

            // Toggle sublist expansion on category header click
            category.querySelector("span").addEventListener("click", function(e) {
                e.stopPropagation();
                sublist.style.display = sublist.style.display === "none" ? "block" : "none";
            });

            return category;
        }

        // 4. Load aircraft definition and model
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
                    if (window.ui && ui.notification) ui.notification.show("Could not load aircraft.json from " + baseUrl);
                }
            });
        }

        // 5. Handle clicks on individual aircraft entries
        extrasPanel.addEventListener("click", function (e) {
            const li = e.target.closest("li[data-url]");
            if (li) {
                const url = li.getAttribute("data-url");
                const mpID = li.getAttribute("data-mpid");
                const name = li.textContent || li.innerText;
                loadAircraftFromUrl(url, mpID, name);
            }
        });

        // 6. Hardcoded aircraft definition
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

    const checkInterval = setInterval(() => {
        if (document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]')) {
            clearInterval(checkInterval);
            initExcrafts();
        }
    }, 1000);

})();
