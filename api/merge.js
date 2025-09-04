import sharp from "sharp";

export default async function handler(req, res) {
  try {
    let { bg, overlay, x = 0, y = 0 } = req.query;

    const repoName = process.env.REPO_NAME;
    if (!repoName) {
      return res.status(500).send("Server misconfigured: REPO_NAME not set");
    }

    const baseURL = `https://raw.githubusercontent.com/crackyellowpants/${repoName}/refs/heads/main/`;

    // 파일명이 그냥 문자면 GitHub raw URL로 변환
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

    // Sharp로 합성 → WebP 그대로 반환, 서버에는 저장하지 않음
    const result = await sharp(bgBuffer)
      .composite([{ input: ovBuffer, top: parseInt(y), left: parseInt(x) }])
      .webp()
      .toBuffer();

    // Cache-Control 없이 반환 → 브라우저가 임시 캐시 사용
    res.setHeader("Content-Type", "image/webp");
    res.send(result);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
}
