
// Function to show contents of the thumbs and make popups when clicked
export const showActiveSellerThumbs = function (clicked = 'shweshwe', type = 'fabric') {
    const popsBox = document.querySelector(".popups");

    popsBox.innerHTML = ' ';
       
    let html = `
    
    <div id="myModal1" class="modal">
        <div class="modal-content">
            <img class="modal__img" src="https://zenergy.site/storage/streetcraft/${clicked}_1.jpg" alt="${clicked}" />
        </div>
        <span class="modal-close" data-modalshow="none">X</span>
    </div>

    <div id="myModal2" class="modal">
        <div class="modal-content">
            <img class="modal__img" src="https://zenergy.site/storage/streetcraft/${clicked}_2.jpg" alt="${clicked}" />
        </div>
        <span class="modal-close" data-modalshow="none">X</span>
    </div>

    <div id="myModal3" class="modal">
        <div class="modal-content">
            <img class="modal__img" src="https://zenergy.site/storage/streetcraft/${clicked}_3.jpg" alt="${clicked}" />
        </div>
        <span class="modal-close" data-modalshow="none">X</span>
    </div>

    <div id="myModal4" class="modal">
        <div class="modal-content">
            <img class="modal__img" src="https://zenergy.site/storage/streetcraft/${clicked}_4.jpg" alt="${clicked}" />
        </div>
        <span class="modal-close" data-modalshow="none">X</span>
    </div>

    <div class="thumbnails">

        <img class="thumb thumbnails__one thumbnails__${type}" data-modalshow="1" id="myImg" src="https://zenergy.site/storage/streetcraft/${clicked}_1.jpg" alt="${clicked}" />
        
        <img class="thumb thumbnails__two thumbnails__${type}" data-modalshow="2" id="myImg" src="https://zenergy.site/storage/streetcraft/${clicked}_2.jpg" alt="${clicked}" />

        <img class="thumb thumbnails__three thumbnails__${type}" data-modalshow="3" id="myImg" src="https://zenergy.site/storage/streetcraft/${clicked}_3.jpg" alt="${clicked}" />
        
        <img class="thumb thumbnails__four thumbnails__${type}" data-modalshow="4" id="myImg" src="https://zenergy.site/storage/streetcraft/${clicked}_4.jpg" alt="${clicked}" />

    </div>

    `;

    popsBox.innerHTML = html;


};