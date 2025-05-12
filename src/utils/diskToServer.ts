import fs from 'fs';
import path from 'path';
import axios from 'axios'
const isModDownloaded = (fileName: string) => {
  return fs.existsSync(path.join(__dirname, 'mods', fileName));
}


export async function downloadFileFromGoogleDrive(driveLink:string, localFilename: string){
  const res = await axios({
    url: driveLink,
    method: 'GET',
    responseType: 'stream'
  });
  const modsPath = path.join(__dirname, 'mods');
  if (!fs.existsSync(modsPath)) {
    fs.mkdirSync(modsPath, { recursive: true });
  }
  const filePath = path.join(__dirname, 'mods', localFilename);
  

  const writer = fs.createWriteStream(filePath);
  
  res.data.pipe(writer);
  
  return new Promise<void>((resolve,reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject)
  })
}