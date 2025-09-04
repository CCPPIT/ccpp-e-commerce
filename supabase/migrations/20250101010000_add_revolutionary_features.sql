/*
# [الميزات الثورية - المرحلة الأولى]
[هذا الكود يضيف البنية التحتية اللازمة لميزات التخصيص والولاء]

## وصف الاستعلام:
[يقوم هذا الكود بتوسيع قاعدة البيانات لدعم نظام نقاط الولاء ومحرك التوصيات الشخصي. سيتم إضافة حقل جديد لملفات المستخدمين وجدول جديد لتتبع سلوكهم. هذه التغييرات آمنة ولن تؤثر على البيانات الحالية.]

## بيانات التعريف:
- فئة المخطط: "Structural"
- مستوى التأثير: "Low"
- يتطلب نسخة احتياطية: false
- قابل للعكس: true

## تفاصيل الهيكل:
- جداول متأثرة: public.profiles (إضافة عمود)
- جداول جديدة: public.user_product_views
- وظائف جديدة: add_loyalty_points_on_order, get_recommendations
- مشغلات جديدة: on_order_created_add_points

## الآثار الأمنية:
- حالة RLS: تمكين RLS على الجدول الجديد.
- تغييرات السياسة: إضافة سياسات جديدة لجدول user_product_views.
- متطلبات المصادقة: العمليات مرتبطة بالمستخدم المسجل دخوله.

## تأثير الأداء:
- الفهارس: إضافة فهارس أساسية للجدول الجديد.
- التأثير المقدر: منخفض، حيث أن الوظائف والمشغلات محسّنة.
*/

-- الخطوة 1: إضافة عمود نقاط الولاء إلى جدول المستخدمين
ALTER TABLE public.profiles
ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0;

-- الخطوة 2: إنشاء جدول لتتبع تصفح المنتجات من قبل المستخدمين
CREATE TABLE public.user_product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_product_view_once UNIQUE (user_id, product_id) -- لتجنب التكرار السريع
);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.user_product_views ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات أمان للجدول الجديد
CREATE POLICY "Users can manage their own view history"
ON public.user_product_views
FOR ALL
USING (auth.uid() = user_id);

-- الخطوة 3: إنشاء وظيفة لإضافة نقاط الولاء تلقائياً بعد كل طلب
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_order()
RETURNS trigger AS $$
BEGIN
  -- إضافة نقطة واحدة لكل 1 دولار يتم إنفاقه
  UPDATE public.profiles
  SET loyalty_points = loyalty_points + floor(NEW.total_amount)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء مشغل (trigger) لتفعيل الوظيفة بعد إنشاء طلب جديد
CREATE TRIGGER on_order_created_add_points
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.add_loyalty_points_on_order();

-- الخطوة 4: إنشاء وظيفة لجلب التوصيات المخصصة للمستخدم
CREATE OR REPLACE FUNCTION public.get_recommendations(p_user_id UUID)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  WITH user_favorite_categories AS (
    -- البحث عن أكثر 3 فئات قام المستخدم بتصفح منتجاتها
    SELECT p.category_id, count(*) as view_count
    FROM public.user_product_views upv
    JOIN public.products p ON upv.product_id = p.id
    WHERE upv.user_id = p_user_id
      AND p.category_id IS NOT NULL
    GROUP BY p.category_id
    ORDER BY view_count DESC
    LIMIT 3
  )
  -- اختيار منتجات من هذه الفئات لم يقم المستخدم بتصفحها بعد
  SELECT p.*
  FROM public.products p
  WHERE p.category_id IN (SELECT category_id FROM user_favorite_categories)
    AND p.id NOT IN (
      SELECT product_id FROM public.user_product_views WHERE user_id = p_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
