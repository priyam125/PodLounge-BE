import { fileURLToPath } from "url";
import path from "path";
import sharp from "sharp";
import prisma from "../config/db.config.js";
import UserDto from "../dtos/user-dto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ActivateController {
  static async activate(req, res) {
    console.log("req.body", req.body);
    const { name, avatar } = req.body;

    if (!name || !avatar) {
      return res.status(400).json({ error: "Name and avatar are required" });
    }

    const buffer = Buffer.from(
      avatar.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, ""),
      "base64"
    );

    const mimeType = avatar.match(/^data:image\/(png|jpg|jpeg|gif);base64,/)[1];
    const extension = mimeType === "jpeg" ? "jpg" : mimeType; // Normalize "jpeg" to "jpg"
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const imagePath = path.resolve(__dirname, `../storage/${fileName}`);

    try {
      await sharp(buffer).resize(200).toFile(imagePath);
    } catch (error) {
      console.error("Error processing image with Sharp:", error);
      return res
        .status(500)
        .json({ error: "Failed to process the image with Sharp" });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        avatar: `/storage/${fileName}`, // Store relative path only
        activated: true,
      },
    });

    return res.status(200).json({
      auth: true,
      user: new UserDto(updatedUser),
    });
  }
}

export default ActivateController;




// import {Jimp} from "jimp";
// import path from "path";
// import UserDto from "../dtos/user-dto.js";
// import prisma from "../config/db.config.js";
// import { fileURLToPath } from 'url';
// import sharp from "sharp";

// class ActivateController {
//   static async activate(req, res) {
//     console.log("req.body", req.body);
//     const { name, avatar } = req.body;

//     if (!name || !avatar) {
//       return res.status(400).json({ error: "Name and avatar are required" });
//     }

//     const __filename = fileURLToPath(import.meta.url);

//     const __dirname = path.dirname(__filename);

//     const buffer = Buffer.from(avatar.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, ""), "base64");

//     console.log("buffer", buffer);

//     // const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

//     // console.log("imagePath", imagePath);

//     // try {
//     //     const jimResp = await Jimp.read(buffer)
//     //     // jimResp.resize(200, Jimp.AUTO).write(path.resolve(__dirname, `../storage/${imagePath}`));
//     //     jimResp.resize(200, Jimp.AUTO).write(path.resolve(__dirname, `../storage/${imagePath}`));

//     // } catch (error) {
//     //   console.error("Failed to activate user:", error);
//     //   return res.status(500).json({ error: "Failed to activate user" });
//     // }

//     const imagePath = path.resolve(__dirname, `../storage/${Date.now()}-${Math.round(Math.random() * 1e9)}.png`);

//     try {
//         await sharp(buffer)
//             .resize(200)
//             .toFile(imagePath);
//     } catch (error) {
//         console.error("Error processing image with Sharp:", error);
//         return res.status(500).json({ error: "Failed to process the image with Sharp" });
//     }

//     const userId = req.user.id;

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     console.log("/storage/", imagePath);

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         name,
//         avatar: `/storage/${imagePath}`,
//         activated: true,
//       },
//     })
    
//     return res.status(200).json({
//       auth: true,
//       user: new UserDto(updatedUser),
//     });
//   }
// }

// export default ActivateController  


