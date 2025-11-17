// we need to import the bcrypt-ts-edge package to synchronise the hash from pw
import { hashSync } from "bcrypt-ts-edge";

const sampleData = {
  "users": [
    {
      "name": "adminUser",
      "email": "craig@yoyozi.com",
      "password": hashSync('123456', 10),
      "role": "admin"
    },
    {
      "name": "userUser",
      "email": "craig@netsecurity.co.za",
      "password": hashSync('123456', 10),
      "role": "user"
    },
    {
      "name": "craftUser",
      "email": "crafter@streetcraft.com",
      "password": hashSync('123456', 10),
      "role": "craft"
    }
  ],
  "categories": [
    {
      "name": "Material",
      "description": "Items sewed and stitched out of cloth",
      "isActive": true
    },
    {
      "name": "Beadwork",
      "description": "Items made using wire and beads",
      "isActive": true
    },
    {
      "name": "Paintings",
      "description": "Paintings from selected artists",
      "isActive": true
    }
  ],
  "crafters": [
    {
      "name": "Charles Chitokoko",
      "location": "Emmerentia",
      "mobile": "087 232 3434",
      "profileImage": null,
      "isActive": true,
    },
    {
      "name": "Vincent",
      "location": "Parktown North",
      "mobile": "065 343 5555",
      "profileImage": null,
      "isActive": true,
    },
    {
      "name": "Chipo (Shweshwe)",
      "location": "Emmerentia",
      "mobile": "0743878521",
      "profileImage": null,
      "isActive": true,
    }
  ],
  "products": [
    {
      "name": "Oven gloves",
      "slug": "oven-gloves",
      "category": "Material",
      "description": "Really handy versatile oven gloves",
      "images": [
        "https://utfs.io/f/LQrirZFCBqETmTKCRl7VLtjgv4zaRNiXPBrCEGI8lyhxAsSb"
      ],
      "price": 59.99,
      "weight": 0,
      "availability": 3,
      "rating": 4.5,
      "numReviews": 10,
      "isFeatured": true,
      "isFirstPage": true,
      "banner": "/images/banner-1.jpg",
      "crafter": "69170d95956b1f5207faae9c",
      "tags": [
        "oven gloves"
      ],
      "crafters": []
    },
    {
      "name": "Dog beds",
      "slug": "dog-beds",
      "category": "Material",
      "description": "Large and small available",
      "images": [
        "https://utfs.io/f/LQrirZFCBqET0BAumbZXpUJfTGrK641lMgjz7PQscIm2uy03"
      ],
      "price": 85.9,
      "weight": 0,
      "availability": 3,
      "rating": 4.2,
      "numReviews": 8,
      "isFeatured": true,
      "isFirstPage": true,
      "banner": "/images/banner-2.jpg",
      "crafter": "69170d95956b1f5207faae9c",
      "tags": [
        "pets",
        "dog beds",
        "beds"
      ],
      "crafters": []
    },
    {
      "name": "locust",
      "slug": "locust",
      "category": "Beadwork",
      "description": "Intricately wire beaded locust",
      "images": [
        "https://utfs.io/f/LQrirZFCBqETG221iFXxIvMpbq7CyFP9THXnzDSdQshrBf5j"
      ],
      "price": 99.95,
      "weight": 0,
      "availability": 3,
      "rating": 4.9,
      "numReviews": 3,
      "isFeatured": false,
      "isFirstPage": true,
      "banner": null,
      "crafter": "6916a259e6b0d5fcb7d3f856",
      "tags": [
        "insect",
        "locust",
        "beadwork"
      ],
      "crafters": []
    },
    {
      "name": "Zebra",
      "slug": "zebra",
      "category": "Beadwork",
      "description": "Capsulated Ozone goodness with olive or hemp seed oil",
      "images": [
        "https://utfs.io/f/LQrirZFCBqETCdY44EV6Fa7te43hsDPEVqjgT0pw5LkxmdrI"
      ],
      "price": 639.95,
      "weight": 0,
      "availability": 3,
      "rating": 3.6,
      "numReviews": 5,
      "isFeatured": false,
      "isFirstPage": false,
      "banner": null,
      "crafter": "6916a309e6b0d5fcb7d3f862",
      "tags": [
        "zebra"
      ],
      "crafters": []
    },
    {
      "name": "Bee",
      "slug": "bee",
      "category": "Beadwork",
      "description": "Cleverly designed and crafted bee",
      "images": [
        "https://utfs.io/f/LQrirZFCBqETTLJmXyiufaYctpZAlmP7dbvGr8WUVEIKwhkg"
      ],
      "price": 79.99,
      "weight": 0,
      "availability": 3,
      "rating": 4.7,
      "numReviews": 18,
      "isFeatured": false,
      "isFirstPage": true,
      "banner": null,
      "crafter": "6916a259e6b0d5fcb7d3f856",
      "tags": [
        "beads",
        "wire",
        "insect",
        "bee"
      ],
      "crafters": []
    },
    {
      "name": "Duck",
      "slug": "duck",
      "category": "Beadwork",
      "description": "Duck, big or small",
      "images": [
        "https://utfs.io/f/LQrirZFCBqETciVBP4DOdfZCNelsoEBSbuOvh0L54VAwM23k"
      ],
      "price": 99.99,
      "weight": 0,
      "availability": 3,
      "rating": 4.6,
      "numReviews": 12,
      "isFeatured": false,
      "isFirstPage": false,
      "banner": null,
      "crafter": "6916a309e6b0d5fcb7d3f862",
      "tags": [
        "duck",
        "beadwork"
      ],
      "crafters": []
    }
  ]
};

export default sampleData;