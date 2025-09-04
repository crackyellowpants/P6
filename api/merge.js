import sharp from "sharp";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  try {
    let { bg, overlay, x = 0, y = 0 } = req.query;

    const repoName = process.env.REPO_NAME;
    if (!repoName) {
      return res.status(500).send("Server misconfigured: REPO_NAME not set");
    }

    const baseURL = `https://raw.githubusercontent.com/crackyellowpants/${repoName}/refs/heads/main/`;

    // bg, overlay가 GitHub 파일명일 경우 URL 변환
    if (bg && !bg.startsWith("http")) bg = `${baseURL}${bg}.webp`;
    if (overlay && !overlay.startsWith("http")) overlay = `${baseURL}${overlay}.webp`;

    if (!bg || !overlay) {
      return res.status(400).send("Missing bg or overlay params");
    }

    // fetch 이미지
    const bgResp = await fetch(bg);
    const ovResp = await fetch(overlay);

    if (!bgResp.ok || !ovResp.ok) {
      return res.status(404).send("Background or overlay image not found on GitHub");
    }

    const bgBuffer = Buffer.from(await bgResp.arrayBuffer());
    const ovBuffer = Buffer.from(await ovResp.arrayBuffer());

    // 합성
    const resultBuffer = await sharp(bgBuffer)
      .composite([{ input: ovBuffer, top: parseInt(y), left: parseInt(x) }])
      .webp()
      .toBuffer();

    // 퍼블릭 디렉토리에 UUID 기반 파일명으로 저장
    const filename = `merged-${uuidv4()}.webp`;
    const filePath = path.join(process.cwd(), "public", filename);

    await fs.promises.writeFile(filePath, resultBuffer);

    // Markdown/AI용 URL 반환
    const url = `${req.headers.origin}/${filename}`;
    res.status(200).json({ url });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
}
