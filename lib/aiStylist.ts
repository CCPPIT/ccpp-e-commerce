export function getAIResponse(userInput: string): string {
  const lowerInput = userInput.toLowerCase();

  if (lowerInput.includes('مناسبة') || lowerInput.includes('حفلة') || lowerInput.includes('عرس')) {
    return 'لحفلة مسائية، أقترح فستاناً أنيقاً باللون الأسود أو الكحلي مع حذاء بكعب عالٍ. يمكنك إضافة لمسة من اللمعان بإكسسوارات فضية.';
  }
  if (lowerInput.includes('عملي') || lowerInput.includes('دوام')) {
    return 'لإطلالة عمل احترافية، يمكنك تنسيق بنطلون قماش واسع مع بلوزة حريرية وبليزر بلون محايد. حذاء لوفر جلدي يكمل الإطلالة بأناقة.';
  }
  if (lowerInput.includes('كاجوال') || lowerInput.includes('يومي')) {
    return 'لإطلالة يومية مريحة، جينز بقصة مستقيمة مع تي-شيرت قطني وحذاء رياضي أبيض هو خيار لا يخطئ. يمكنك إضافة جاكيت جينز لمزيد من الدفء.';
  }
  if (lowerInput.includes('لون') || lowerInput.includes('تنسيق')) {
    return 'لتنسيق الألوان، جرب قاعدة 60-30-10. 60% للون الأساسي، 30% للون الثانوي، و10% للمسة لونية جريئة. مثلاً: بيج، أبيض، ولمسة من الأخضر الزيتي.';
  }
  if (lowerInput.includes('شكراً')) {
    return 'على الرحب والسعة! هل هناك أي شيء آخر يمكنني مساعدتك به؟';
  }

  return 'لم أفهم طلبك تماماً. هل يمكنك أن تسأل عن تنسيق ملابس لمناسبة معينة، أو عن ألوان، أو عن إطلالة يومية؟';
}
