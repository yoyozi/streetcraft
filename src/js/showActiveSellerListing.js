
// Function to show contents of seller listing
export const showActiveSellerListing = function (clicked = 'ShweShwe', items = 'Dog beds, placemats, shopping bags, picnic blankets', type = 'fabric') {

    const listingBox = document.querySelector(".listing__box");
    const dragBox = document.querySelector(".drag__box");

    let html = `
    
        <div id="mydivheader" class="drag__boxheader drag__box-${type}">${clicked}
        </div>
        <p class="drag__boxheader--sub">[move me]</p>
        <p class="drag__boxstring">${items}</p>
    `;

    // listingBox.innerHTML = "";
    // listingBox.insertAdjacentHTML("afterbegin", html);
    dragBox.innerHTML = "";
    dragBox.insertAdjacentHTML("afterbegin", html)
                
};

