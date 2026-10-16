// ==UserScript==
// @name         GeoFS Excrafts Importer
// @version      1.0
// @description  Imports custom aircraft into GeoFS from geofs-excrafts
// @author       YourName
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log("Excrafts script running...");

    // URL to your aircraft manifest on GitHub
    const DATA_URL = "https://raw.githubusercontent.com/YourUsername/geofs-excrafts/main/aircraft.json";

    // Clone the native GeoFS aircraft button to match layout and font
    const aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
    if (!aircraftButton) {
        console.warn("Aircraft button not found.");
        return;
    }

    const extrasButton = aircraftButton.cloneNode(true);
    extrasButton.textContent = "Excrafts";
    extrasButton.removeAttribute("data-toggle-panel");
    extrasButton.setAttribute("data-toggle-panel", ".geofs-excrafts-list");
    extrasButton.id = "excrafts-button";
    aircraftButton.parentNode.insertBefore(extrasButton, aircraftButton);

    // Create the dropdown panel using native GeoFS classes for consistent styling
    const extrasPanel = document.createElement("ul");
    extrasPanel.className = "geofs-list geofs-excrafts-list geofs-toggle-panel";

    extrasPanel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; padding-left: 20px;">
            <h4 style="margin: 0;">GeoFS Excrafts</h4>
        </div>
    `;

    const aircraftPanel = document.querySelector(".geofs-aircraft-list");
    if (aircraftPanel && aircraftPanel.parentNode) {
        aircraftPanel.parentNode.insertBefore(extrasPanel, aircraftPanel.nextSibling);
    }

    function createCategorySection(title, items) {
        const category = document.createElement("li");
        category.className = "geofs-list-collapsible-item";
        category.textContent = title;

        const sublist = document.createElement("ul");
        sublist.className = "geofs-collapsible";

        items.forEach(item => {
            const li = document.createElement("li");
            li.setAttribute("data-url", item.modelUrl);
            li.setAttribute("data-mpid", item.id || "1000");

            const itemContent = document.createElement("span");
            itemContent.textContent = item.name;
            li.appendChild(itemContent);
            sublist.appendChild(li);
        });

        category.appendChild(sublist);
        return category;
    }

    function loadAircraftFromUrl(modelUrl, name) {
        console.log(`[Excrafts] Loading ${name} from ${modelUrl}`);
        
        if (!window.geofs || !window.geofs.aircraft || !window.geofs.aircraft.instance) {
            console.error("[Excrafts] Aircraft instance unavailable.");
            return;
        }

        // Hide default model and load custom .glb model
        if (geofs.aircraft.instance.definition && geofs.aircraft.instance.definition.model) {
            geofs.aircraft.instance.definition.model.setVisibility(false);
        }

        let customModel = new geofs.api.Model({
            url: modelUrl,
            scale: 1,
            minimumPixelSize: 1
        });

        geofs.aircraft.instance.definition.model = customModel;
        customModel.setLocation(geofs.aircraft.instance.llaLocation, geofs.aircraft.instance.htr);
        
        if (ui && ui.notification) {
            ui.notification.show(`Loaded ${name}`);
        }
    }

    // Event listener for clicking items inside your custom panel
    extrasPanel.addEventListener("click", function (e) {
        const li = e.target.closest("li[data-url]");
        if (li) {
            const modelUrl = li.getAttribute("data-url");
            const name = li.textContent;
            loadAircraftFromUrl(modelUrl, name);
        }
    });

    // Fetch your GitHub manifest and populate the menu
    fetch(DATA_URL)
        .then(response => response.json())
        .then(data => {
            // Assuming your JSON groups items by categories or is a flat list
            if (Array.isArray(data)) {
                const section = createCategorySection("Custom Aircraft", data);
                extrasPanel.appendChild(section);
            } else {
                for (const [category, items] of Object.entries(data)) {
                    const section = createCategorySection(category, items);
                    extrasPanel.appendChild(section);
                }
            }
        })
        .catch(error => {
            console.error("Error loading Excrafts data:", error);
        });
})();
