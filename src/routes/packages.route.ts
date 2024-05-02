import express, { Request } from "express";
import multer from "multer";
import {
  createPackage,
  deletePackageImage,
  getPackageDetailsBySlug,
  getPackageStats,
  getPackages,
  updatePackage,
} from "../controllers/package.controller";
import verifyToken from "../middleware/verifyToken.middleware";
import { packageValidation } from "../validations/package.validation";

const router = express.Router();
const storage = multer.memoryStorage();
const filter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (["jpeg", "jpg", "png"].includes(file.mimetype.split("/")[1])) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filter });

//admin
router.get("/", verifyToken, getPackages);
router.get("/stats", verifyToken, getPackageStats);

router.post("/", verifyToken, upload.array("images"), packageValidation(), createPackage);

router.put("/:packageId", verifyToken, upload.array("images"), packageValidation(), updatePackage);

router.delete("/:packageId/image/:imageId", verifyToken, deletePackageImage);

//frontend
router.get("/:packageSlug", getPackageDetailsBySlug);

export default router;
