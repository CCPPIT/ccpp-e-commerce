import { faker } from '@faker-js/faker';
import { supabase } from '../lib/supabase';

// Arabic category names
const arabicCategories = [
  { name_ar: 'الإلكترونيات', name_en: 'Electronics' },
  { name_ar: 'الملابس', name_en: 'Clothing' },
  { name_ar: 'المنزل والحديقة', name_en: 'Home & Garden' },
  { name_ar: 'الرياضة', name_en: 'Sports' },
  { name_ar: 'الكتب', name_en: 'Books' },
  { name_ar: 'الجمال والعناية', name_en: 'Beauty & Care' },
];

// Arabic product names and descriptions
const arabicProducts = [
  {
    name_ar: 'هاتف ذكي متطور',
    name_en: 'Advanced Smartphone',
    description_ar: 'هاتف ذكي بتقنية حديثة وكاميرا عالية الجودة',
  },
  {
    name_ar: 'قميص قطني أنيق',
    name_en: 'Elegant Cotton Shirt',
    description_ar: 'قميص قطني مريح وأنيق مناسب لجميع المناسبات',
  },
  {
    name_ar: 'طاولة خشبية فاخرة',
    name_en: 'Luxury Wooden Table',
    description_ar: 'طاولة خشبية عالية الجودة وتصميم عصري',
  },
  {
    name_ar: 'حذاء رياضي مريح',
    name_en: 'Comfortable Sports Shoes',
    description_ar: 'حذاء رياضي مريح ومناسب للجري والأنشطة الرياضية',
  },
  {
    name_ar: 'كتاب تطوير الذات',
    name_en: 'Self Development Book',
    description_ar: 'كتاب مفيد في تطوير الذات والنجاح في الحياة',
  },
  {
    name_ar: 'كريم العناية بالبشرة',
    name_en: 'Skin Care Cream',
    description_ar: 'كريم طبيعي للعناية بالبشرة وترطيبها',
  },
  {
    name_ar: 'ساعة ذكية رياضية',
    name_en: 'Smart Sports Watch',
    description_ar: 'ساعة ذكية لتتبع الأنشطة الرياضية واللياقة البدنية',
  },
  {
    name_ar: 'حقيبة يد أنيقة',
    name_en: 'Elegant Handbag',
    description_ar: 'حقيبة يد عصرية وأنيقة مصنوعة من الجلد الطبيعي',
  },
];

export async function seedData() {
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...');

    // Add categories
    console.log('📝 إضافة الفئات...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(
        arabicCategories.map((cat, index) => ({
          name_ar: cat.name_ar,
          name_en: cat.name_en,
          description_ar: `وصف فئة ${cat.name_ar}`,
          image_url: `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/300x200.png&text=${encodeURIComponent(cat.name_ar)}`,
          is_active: true,
          sort_order: index + 1,
        }))
      )
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`✅ تم إضافة ${categories?.length} فئة بنجاح`);

    // Add products
    console.log('📦 إضافة المنتجات...');
    const products = [];
    
    for (let i = 0; i < arabicProducts.length; i++) {
      const product = arabicProducts[i];
      const category = categories?.[Math.floor(Math.random() * categories.length)];
      
      const basePrice = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
      const hasSale = faker.datatype.boolean();
      const salePrice = hasSale ? basePrice * 0.8 : null;

      products.push({
        name_ar: product.name_ar,
        name_en: product.name_en,
        description_ar: product.description_ar,
        description_en: faker.lorem.paragraph(),
        price: basePrice,
        sale_price: salePrice,
        category_id: category?.id,
        image_urls: [
          `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x400.png&text=${encodeURIComponent(product.name_ar)}`,
          `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x400.png&text=${encodeURIComponent(product.name_ar + ' 2')}`,
        ],
        stock_quantity: faker.number.int({ min: 0, max: 100 }),
        is_featured: faker.datatype.boolean(),
        is_active: true,
      });
    }

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) throw productsError;
    console.log(`✅ تم إضافة ${insertedProducts?.length} منتج بنجاح`);

    console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
    return { success: false, error };
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedData().then((result) => {
    if (result.success) {
      console.log('✨ انتهى تشغيل البرنامج بنجاح');
    } else {
      console.error('💥 فشل في تشغيل البرنامج:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  });
}
