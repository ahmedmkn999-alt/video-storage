import { Octokit } from "@octokit/rest";

// إعداد الاتصال بجيت هب
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // المفتاح اللي حطيناه في Environment Variables
});

// إعدادات حجم الملف المسموح به على Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};

export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { fileName, fileData, userNickname } = req.body;

    if (!fileData) {
      return res.status(400).json({ message: 'No file data received' });
    }

    // تحويل البيانات من Base64 لـ Buffer
    const content = Buffer.from(fileData, 'base64');

    // تنظيم المسار: فيديوهات / اسم المستخدم / التاريخ - اسم الملف
    const path = `videos/${userNickname || 'user'}/${Date.now()}-${fileName}`;

    // الرفع الفعلي لـ GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: 'ahmedmkn999-alt', // اسم اليوزر بتاعك من الصورة
      repo: 'video-storage',     // اسم الريبو بتاعك من الصورة
      path: path,
      message: `Upload: ${fileName} by ${userNickname || 'Orbit User'}`,
      content: content.toString('base64'),
    });

    // رابط الفيديو الخام (Raw)
    const videoUrl = `https://raw.githubusercontent.com/ahmedmkn999-alt/video-storage/main/${path}`;

    return res.status(200).json({
      success: true,
      url: videoUrl,
      message: 'تم الرفع للمخزن بنجاح!'
    });

  } catch (error) {
    console.error("Error details:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'فشل الرفع للسيرفر', 
      error: error.message 
    });
  }
}
