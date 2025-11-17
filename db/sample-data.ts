// we need to import the bcrypt-ts-edge package to synchronise the hash from pw
import { hashSync } from "bcrypt-ts-edge";

const sampleData = {
  users: [
    {
      name: 'adminUser',
      email: 'craig@yoyozi.com',
      password: hashSync('123456', 10),
      role: 'admin'
    },
        {
      name: 'userUser',
      email: 'craig@netsecurity.co.za',
      password: hashSync('123456', 10),
      role: 'user'
    },
    {
      name: 'Charles Craft',
      email: 'charles@streetcraft.co.za',
      password: hashSync('123456', 10),
      role: 'craft'
    },
    {
      name: 'Leonard Artisan',
      email: 'leonard@streetcraft.co.za',
      password: hashSync('123456', 10),
      role: 'craft'
    }
  ],
  categories: [
    {
      name: 'Material',
      description: 'Items sewed and stitched out of cloth',
      isActive: true,
    },
    {
      name: 'Beadwork',
      description: 'Items made using wire and beads',
      isActive: true,
    },
    {
      name: 'Paintings',
      description: 'Paintings from selected artists',
      isActive: true,
    },
  ],
  crafters: [
    {
      name: 'Charles Chitokoko',
      location: 'Emmerentia',
      mobile: '+27 21 555 0123',
      profileImage: '/images/crafters/active-oxygen-crafts.jpg',
      products: [] // Will be populated with product IDs after creation
    },
    {
      name: 'Leonard',
      location: 'Hyde park', 
      mobile: '+27 11 888 0456',
      profileImage: '/images/crafters/wellness-workshop.jpg',
      products: [] // Will be populated with product IDs after creation
    }
  ],
  products: [
    {
      name: 'Ozone hand soap',
      slug: 'ozone-hand-soap',
      category: "Material",
      description: 'A deep cleaning anti bacterial Ozone soap',
      images: [
        '/images/sample-products/p1-1.png',
        '/images/sample-products/p1-2.png',
      ],
      price: 59.99,
      rating: 4.5,
      numReviews: 10,
      isFeatured: true,
      banner: '/images/banner-1.jpg',
      tags: ['antibacterial', 'ozone', 'handmade', 'natural'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
    {
      name: 'Ozone Gell',
      slug: 'ozone-gell',
      category: "Beadwork",
      description: 'For healing wounds, sores or growths',
      images: [
        '/images/sample-products/p2-1.png',
        '/images/sample-products/p2-2.png',
      ],
      price: 85.9,
      rating: 4.2,
      numReviews: 8,
      isFeatured: true,
      banner: '/images/banner-2.jpg',
      tags: ['healing', 'ozone', 'gel', 'therapeutic'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
    {
      name: 'Anti bacterial hand or body cream',
      slug: 'anti-bacterial-hand-or-body-cream',
      category: "Material",
      description: 'Great sanitizer and moisturiser',
      images: [
        '/images/sample-products/p3-1.png',
        '/images/sample-products/p3-2.png',
      ],
      price: 99.95,
      rating: 4.9,
      numReviews: 3,
      isFeatured: false,
      banner: null,
      tags: ['antibacterial', 'cream', 'moisturizer', 'organic'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
    {
      name: 'Ozone pills',
      slug: 'ozone-pills',
      category: "Beadwork",
      description: 'Capsulated Ozone goodness with olive or hemp seed oil',
      images: [
        '/images/sample-products/p4-1.png',
        '/images/sample-products/p4-2.png',
      ],
      price: 39.95,
      rating: 3.6,
      numReviews: 5,
      isFeatured: false,
      banner: null,
      tags: ['ozone', 'supplement', 'wellness', 'capsules'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
    {
      name: 'Ozone and steam sauna',
      slug: 'ozone-and-steam-sauna',
      category: "Paintings",
      description: 'Ozone and steam therapy',
      images: [
        '/images/sample-products/p5-1.png',
        '/images/sample-products/p5-2.png',
      ],
      price: 79.99,
      rating: 4.7,
      numReviews: 18,
      isFeatured: false,
      banner: null,
      tags: ['ozone', 'sauna', 'steam', 'therapy', 'wellness'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
    {
      name: 'Pool or sauna ozonator',
      slug: 'pool-or-sauna-ozonator',
      category: "Paintings",
      description: 'Generating of Ozone for suanas or pools',
      images: [
        '/images/sample-products/p6-1.png',
        '/images/sample-products/p6-2.png',
      ],
      price: 99.99,
      rating: 4.6,
      numReviews: 12,
      isFeatured: false,
      banner: null,
      tags: ['ozone', 'ozonator', 'pool', 'sauna', 'equipment'],
      crafters: [] // Will be populated with crafter IDs after creation
    },
  ],
};

export default sampleData;
