import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { bg, overlay, x = 0, y = 0 } = req.query;

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
