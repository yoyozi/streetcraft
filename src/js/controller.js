import "../sass/main.scss";

import { showActiveSellerListing } from "./showActiveSellerListing.js";
import { showActiveSellerThumbs } from "./showActiveSellerThumbs.js";
import { dragable } from "./dragable.js";

import { COORDS } from "./config.js";
import { geojson } from "./geojson.js";
import fabricMarker from 'url:../svg/fabric.svg';
import beadworkMarker from 'url:../svg/beadwork.svg';
import hairMarker from 'url:../svg/hair.svg';
import fencingMarker from 'url:../svg/fencing.svg';
import artMarker from 'url:../svg/artwork.svg';
import leatherMarker from 'url:../svg/leatherwork.svg';

// Put the map together and add the markers
const showMapMarkers = function () {
    // Put map on page from position (HARD CODED for now)
    if (navigator.geolocation) {

        const map = L.map('map', {closePopupOnClick: false, scrollWheelZoom: false,}).setView(COORDS, 12);

        // Define the tiling
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        
        // Innitialise the map
        osm.addTo(map);

        const geoJsonAdded = L.geoJSON(geojson, {

            pointToLayer: function(feature = {}, latlng) {

                const { properties = {} } = feature;     // define properties as object from feature
                const { Name, Type } = properties;
                    
                // create a marker style / we innitialise it
                const logoMarkerStyle = L.Icon.extend({
                    options: {
                        iconSize: [38, 38],
                        iconAnchor: [16, 38],
                        popupAnchor: [4, -34],
                        // onClick: markerOnClick,
                    }
                });
        
                // A switch to set logo, popup and content with className based on type of seller
                switch(Type){
                    case 'fabric':
                        var logoMarker = new logoMarkerStyle({iconUrl: fabricMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        
                        break;

                    case 'hair':
                        var logoMarker = new logoMarkerStyle({iconUrl: hairMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        break;

                    case 'beadwork':
                        var logoMarker = new logoMarkerStyle({iconUrl: beadworkMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        break;

                    case 'fencing':
                        var logoMarker = new logoMarkerStyle({iconUrl: fencingMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        break;

                    case 'artwork':
                        var logoMarker = new logoMarkerStyle({iconUrl: artMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        break;

                    case 'leatherwork':
                        var logoMarker = new logoMarkerStyle({iconUrl: leatherMarker})
                        var popup2 = L.popup({maxWidth: 400, className: `${Type}-popup`, closeButton: false})
                            .setLatLng(latlng)
                            .setContent(`${Name}`).openPopup();
                        break;

                    default:
                        console.log('FAIL!');
                };


                // We return for each the larker on map and add the mouseover for mobile
                return L.marker(latlng, 
                    {icon: logoMarker}) 
                    // {popup: myPopup})
                    // .on('click', markerOnClick)
                    .on('mouseover', function() {
                    this.bindPopup(popup2).openPopup();
                });
                

                
            },

            // Using on each: we go through each of the features and add an addEventListener
            // in leaflets way to if clicked run the function "markerOnClick"
            onEachFeature: (feature = {}, layer) => {

                L.featureGroup([layer])
                    .on('click', markerOnClick);
            }
           
        })

        geoJsonAdded.addTo(map);
        
        // Determine the bounds and extent the map covers when opening based on markers
        map.fitBounds(geoJsonAdded.getBounds(), {
            padding: [60,80]
        });
    }
};



// Thumnail eventlistener and handler: must only load after thumbs!
const eventHandler = function() {

    document.addEventListener("click", handle);

    function handle(evt) {
        const origin = evt.target;
        //console.log(origin);
        if (origin.dataset.modalshow) {
        //         ∟ only do stuff if element contains [data-modalshow]        
            return showModal(
            document.querySelector(`#myModal${origin.dataset.modalshow}`), 
            origin.dataset.modalshow === "none" );
        }
    }

    function showModal(modalElem, hideAll) {
        document.querySelectorAll(".modal").forEach(el => el.style.display = "none");
        //                                  ∟ hide all '.modal'
        if (!hideAll) {
            modalElem.style.display = "block";  
        }
    }

}

// Main function after reading geojson and runs all others
function markerOnClick(e) {

    const obj = e.propagatedFrom.feature.properties;
    const sellerClicked = obj.Name;
    const sellerItems = obj.Listing;
    const sellerType = obj.Type;
    const sellerClickedLc = sellerClicked.toLowerCase();


    showActiveSellerListing(sellerClicked, sellerItems, sellerType);
    showActiveSellerThumbs(sellerClickedLc, sellerType)
    dragable();
    eventHandler();
}

showMapMarkers();
showActiveSellerListing();
showActiveSellerThumbs();
dragable();
eventHandler();

