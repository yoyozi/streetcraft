import { connectDB, Crafter, Product, Category, User } from '../lib/mongodb/models';

async function fetchDatabaseData() {
  try {
    await connectDB();
    
    // Fetch all crafters
    const crafters = await Crafter.find({}).lean();
    console.log('CRAFTERS:');
    console.log(JSON.stringify(crafters, null, 2));
    
    // Fetch all products
    const products = await Product.find({}).lean();
    console.log('\nPRODUCTS:');
    console.log(JSON.stringify(products, null, 2));
    
    // Fetch all categories
    const categories = await Category.find({}).lean();
    console.log('\nCATEGORIES:');
    console.log(JSON.stringify(categories, null, 2));
    
    // Fetch all users (without passwords)
    const users = await User.find({}).select('-password').lean();
    console.log('\nUSERS:');
    console.log(JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error fetching database data:', error);
  } finally {
    process.exit(0);
  }
}

fetchDatabaseData();
