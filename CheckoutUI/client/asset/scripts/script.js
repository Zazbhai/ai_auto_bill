var InitialCount = -1;

function clearAllProducts() {
    fetch('http://localhost:3000/product', {
        method: 'DELETE'
    })
    .then(response => response.text())
    .then(data => {
        console.log(data); // Output: "All products have been deleted."
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

var lastProductsLength = 0;
var lastTakenValues = {};

const loadProducts = async () => {
    let url = 'http://localhost:3000/product';

    try {
        let res = await axios.get(url);
        let products = res.data;
        let currentLength = products.length;
        
        // 🔥 Check if `products.length` has changed (new product added/removed)
        if (currentLength !== lastProductsLength) {
            updateUI(products);
            lastProductsLength = currentLength; // Update last known length
            return;
        }

        // 🔥 Check if `taken` value of any product has changed
        let takenChanged = products.some(product => {
            return lastTakenValues[product.id] !== product.taken;
        });

        if (takenChanged) {
            updateUI(products);
            // Update stored `taken` values
            lastTakenValues = products.reduce((acc, product) => {
                acc[product.id] = product.taken;
                return acc;
            }, {});
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
};

// ✅ Function to update the UI
function updateUI(products) {
    if (products.length === 0) {
        $("#1").css("display", "grid");
        $("#home").css("display", "none");
        $("#2").css("display", "none");
        return;
    }

    $("#1").css("display", "none");
    $("#home").css("display", "grid");
    $("#2").css("display", "grid");

    let payable = 0;
    document.getElementById('home').innerHTML = ""; // Clear old UI

    products.forEach(product => {
        var exact_price = product.payable * product.taken
        payable += parseFloat(exact_price);

        let x = `
        <section>
            <div class="card card-long animated fadeInUp once">
                <img src="asset/img/${product.id}.jpg" class="album">
                <div class="span1">Product Name</div>
                <div class="card__product">
                    <span>${product.name}</span>
                </div>
                <div class="span2">Per Unit</div>
                <div class="card__price">
                    <span>${product.price}</span>
                </div>
                <div class="span3">Units</div>
                <div class="card__unit">
                    <span>${product.taken} pcs</span>
                </div>
                <div class="span4">Payable</div>
                <div class="card__amount">
                    <span>₹ ${exact_price}</span>
                </div>
            </div>
        </section>
        `;

        document.getElementById('home').innerHTML += x;
    });

    document.getElementById('2').innerHTML = "CHECKOUT ₹" + payable;
}

// 🔥 Run `loadProducts()` every 3 seconds (or adjust as needed)
setInterval(loadProducts, 3000);


var checkout = async () => {
    document.getElementById('2').innerHTML = "<span class='loader-16' style='margin-left: 44%;'></span>";

    try {
        let payable = 0;
        let url = 'http://localhost:3000/product';

        let res = await axios.get(url);
        let products = res.data;

        for (let product of products) {
            exact_price = product.payable * product.taken
            
            payable += parseFloat(exact_price);
        }

        let upiLink = `upi://pay?pa=anshrohilla.b81@okicici&pn=Ansh Rohilla&am=${payable.toFixed(2)}&cu=INR&aid=uGICAgKDE8uLVdw`;
        let encodedUPI = encodeURIComponent(upiLink);

        let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUPI}`;

        document.getElementById('home').style.display = "none";
        document.getElementById('final').style.display = "none";
         
        document.getElementById('qr').style.display = "grid";
        document.getElementById('image').src = qrUrl;

        setTimeout(async () => {
            
            await clearAllProducts();
            setTimeout(() => {
                window.location.href = "success.html";
            }, 5000);
        }, 5000);
    } catch (error) {
        console.error("Error during checkout:", error);
    }
};