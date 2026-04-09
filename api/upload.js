import { Octokit } from "@octokit/rest";

// إعداد الاتصال بجيت هب باستخدام التوكن بتاعك
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // هنضيف ده في إعدادات Vercel
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // تقدر تزود الحجم حسب الحاجة (Vercel Free حده 4.5MB للطلب الواحد)
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'فقط طلبات POST مسموحة' });
  }

  try {
    const { fileName, fileData, userNickname } = req.body;

    // تحويل البيانات من Base64 (اللي جاية من الموبايل) لـ Buffer
    const content = Buffer.from(fileData, 'base64');

    // تحديد مسار الملف جوه الريبو (هننظمه بالفولدرات)
    const path = `videos/${userNickname || 'anonymous'}/${Date.now()}-${fileName}`;

    // عملية الرفع الفعليه لـ GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: 'AhmedMohamed', // اكتب هنا اسم اليوزر بتاعك في جيت هب
      repo: 'my-cdn-storage', // اسم الريبو اللي عملته
      path: path,
      message: `رفع فيديو جديد من: ${userNickname}`,
      content: content.toString('base64'),
    });

    // الرد بلينك الفيديو المباشر (Raw link)
    const videoUrl = `https://raw.githubusercontent.com/AhmedMohamed/my-cdn-storage/main/${path}`;

    return res.status(200).json({
      success: true,
      url: videoUrl,
      message: 'تم الرفع بنجاح لمخزنك الخاص!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'حصلت مشكلة في الرفع', error: error.message });
  }
}
