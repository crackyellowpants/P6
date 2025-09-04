import sharp from "sharp";

export default async function handler(req, res) {
  try {
    let { bg, overlay, x = 0, y = 0 } = req.query;

    // GitHub raw base URL
    const baseURL = "https://raw.githubusercontent.com/crackyellowpants/P6/refs/heads/main/";

    // 만약 bg, overlay가 그냥 파일명(예: "EXAMPLE")이면 GitHub raw URL로 변환
    if (bg && !bg.startsWith("http")) {
      bg = `${baseURL}${bg}.webp`;
    }
    if (overlay && !overlay.startsWith("http")) {
      overlay = `${baseURL}${overlay}.webp`;
    }

    if (!bg || !overlay) {
      return res.status(400).send("Missing bg or overlay params");
    }

    const bgResp = await fetch(bg);
    const ovResp = await fetch(overlay);

    const bgBuffer = Buffer.from(await bgResp.arrayBuffer());
    const ovBuffer = Buffer.from(await ovResp.arrayBuffer());

    const result = await sharp(bgBuffer)
      .composite([{ input: ovBuffer, top: parseInt(y), left: parseInt(x) }])
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
}
