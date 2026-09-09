const mongoose = require("mongoose");
const SharedNote = require("../models/SharedNote");

const getUserId = (req) => req.user?._id || req.user?.id || req.auth?.userId || null;
const getUserName = (req) => {
  const user = req.user || {};
  return String(user.displayName || user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "PoliSync User").trim().slice(0, 180);
};

function cleanText(value, max) { return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, max); }
function validUserId(req) { const id = getUserId(req); return id && mongoose.Types.ObjectId.isValid(id) ? id : null; }

function publicNote(note) {
  return { _id: note._id, name: note.name, header: note.header, body: note.body, authorId: note.authorId, authorName: note.authorName,
    attachments: (note.attachments || []).map((file) => ({ _id: file._id, name: file.name, contentType: file.contentType, size: file.size, url: `/api/notes/${note._id}/attachments/${file._id}` })),
    createdAt: note.createdAt, updatedAt: note.updatedAt };
}

exports.list = async (req, res) => {
  try {
    const userId = validUserId(req); if (!userId) return res.status(401).json({ success:false, message:"Authentication required." });
    const notes = await SharedNote.find({ authorId:userId }).sort({ updatedAt:-1 }).select("-attachments.data").lean();
    return res.json({ success:true, notes:notes.map(publicNote) });
  } catch (error) { console.error("List personal notes error:",error); return res.status(500).json({ success:false,message:"Unable to load your Notes." }); }
};

exports.create = async (req,res) => {
  try {
    const authorId=validUserId(req); if(!authorId) return res.status(401).json({success:false,message:"Authentication required."});
    const name=cleanText(req.body?.name,180), header=cleanText(req.body?.header,300), body=cleanText(req.body?.body,10000);
    if(!name) return res.status(400).json({success:false,message:"Note name is required."});
    const files=Array.isArray(req.files)?req.files:[];
    const attachments=files.map(file=>({name:cleanText(file.originalname||"attachment",180)||"attachment",contentType:String(file.mimetype||"application/octet-stream").slice(0,120),size:Number(file.size||0),data:file.buffer}));
    const note=await SharedNote.create({name,header,body,authorId,authorName:getUserName(req),attachments});
    return res.status(201).json({success:true,note:publicNote(note)});
  } catch(error){console.error("Create personal note error:",error);return res.status(500).json({success:false,message:error.message||"Unable to save Note."});}
};

exports.update = async (req,res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({success:false,message:"Invalid Note ID."});
    const userId=validUserId(req); if(!userId) return res.status(401).json({success:false,message:"Authentication required."});
    const note=await SharedNote.findOne({_id:req.params.id,authorId:userId}); if(!note) return res.status(404).json({success:false,message:"Note not found."});
    if(req.body?.name!==undefined){const name=cleanText(req.body.name,180);if(!name)return res.status(400).json({success:false,message:"Note name is required."});note.name=name;}
    if(req.body?.header!==undefined) note.header=cleanText(req.body.header,300); if(req.body?.body!==undefined) note.body=cleanText(req.body.body,10000);
    const files=Array.isArray(req.files)?req.files:[]; files.forEach(file=>note.attachments.push({name:cleanText(file.originalname||"attachment",180)||"attachment",contentType:String(file.mimetype||"application/octet-stream").slice(0,120),size:Number(file.size||0),data:file.buffer}));
    await note.save(); return res.json({success:true,note:publicNote(note)});
  } catch(error){console.error("Update personal note error:",error);return res.status(500).json({success:false,message:error.message||"Unable to save Note changes."});}
};

exports.remove = async (req,res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({success:false,message:"Invalid Note ID."});
    const userId=validUserId(req); if(!userId) return res.status(401).json({success:false,message:"Authentication required."});
    const result=await SharedNote.deleteOne({_id:req.params.id,authorId:userId}); if(!result.deletedCount)return res.status(404).json({success:false,message:"Note not found."});
    return res.json({success:true,message:"Note deleted."});
  } catch(error){console.error("Delete personal note error:",error);return res.status(500).json({success:false,message:"Unable to delete Note."});}
};

exports.attachment = async (req,res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)||!mongoose.Types.ObjectId.isValid(req.params.attachmentId))return res.status(400).end();
    const userId=validUserId(req); if(!userId)return res.status(401).json({success:false,message:"Authentication required."});
    const note=await SharedNote.findOne({_id:req.params.id,authorId:userId}).select("attachments"); const file=note?.attachments?.id(req.params.attachmentId); if(!file)return res.status(404).end();
    res.set("Content-Type",file.contentType);res.set("Content-Length",String(file.size));res.set("Content-Disposition",`inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);return res.send(file.data);
  } catch(error){console.error("Serve personal note attachment error:",error);return res.status(500).end();}
};
