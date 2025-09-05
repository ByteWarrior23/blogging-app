import {v2 as cloudinary} from "cloudinary";
import {fs} from "fs";

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key : process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_API_SECRET
})

const uploadOnCloudinary = async (file,folder) =>{
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            file,
            {folder: folder},
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    // Optionally, delete the local file after upload
                    fs.unlinkSync(file);
                    resolve(result);
                }
            }
        );
    });
}
   
cloudinary.uploader.upload("sample.jpg"
    ,{folder : "users"} ,
    function(error, result)
    {console.log(result, error); });
