const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
var cors = require('cors')
var bodyParser = require('body-parser')
const path = require('path'); // uploads 디렉토리를 정적 파일을 제공하는 디렉토리로 설정  백엔드 에 업로드된 이미지 프론트에서 가져올때 이거 있어야함
const app = express()
require("dotenv").config();
const port = 3050

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // uploads 디렉토리를 정적 파일을 제공하는 디렉토리로 설정  백엔드 에 업로드된 이미지 프론트에서 가져올때 이거 있어야함

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected to database...'))
.catch((e) => console.log('MongoDB error:', e));


// 멤버 스키마
const memberSchema = new mongoose.Schema({
    id: String,
    pw: String,
    pwCheck: String,
    nick: String,
    key: String,
    intro : String,
    profileImg : {
        fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number
    }
}, { collection: 'member' });

const Member = mongoose.model('member', memberSchema);


// 레시피 스키마
const recipeSchema = new mongoose.Schema({
    category: String,
    people: String,
    title: String,
    intro: String,
    recipeKey: String,
    view : Number,
    favorite : Number,
    userInfo: { key: String, id: String, nick: String } ,
    rawInfo: [{ raw: String, volume: String, unit: String }],
    step: [ { stepText: String } ]
}, { collection: 'recipe' });

const Recipe = mongoose.model('recipe', recipeSchema);


// 조리순서 이미지 스키마
const stepImgSchema = new mongoose.Schema({
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number
}, { collection: 'stepImg' });

const StepImg = mongoose.model('stepImg', stepImgSchema);


// 썸네일 이미지 스키마
const thumbnailSchema = new mongoose.Schema({
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number
}, { collection: 'thumbnail' });

const Thumbnail = mongoose.model('thumbnail', thumbnailSchema);



// 즐겨찾기 스키마
const favoriteSchema = new mongoose.Schema({
    recipeKey : String,
    userKey : String
}, { collection: 'favorite' });

const Favorite = mongoose.model('favorite', favoriteSchema);


// 코멘트 스키마
const commentSchema = new mongoose.Schema({
    recipeKey : String,
    userKey : String,
    userNick : String,
    commentKey : String,
    content : String,
    time : String
}, { collection: 'comment' });

const Comment = mongoose.model('comment', commentSchema);







const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // 파일이 업로드될 폴더를 지정해야 한다.
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // 업로드된 파일의 이름을 그대로 사용한다.
    }
})


// multer 미들웨어 생성
const upload = multer({ storage: storage })



app.get('/login', async(req, res) => {
    const {loginId, loginPw} = req.query


    let data = await Member.findOne({id : loginId, pw : loginPw})

    if(data){
        res.json(data); 
    } else{
        res.json(false);
    }
});

// 회원가입
app.post('/sign', async (req, res) => {
    
    const qData = req.body;

    await Member.create(qData);

    let data = await Member.findOne({id: qData.id , pw: qData.pw, key: qData.key});
    res.json(data);
})

// ID중복확인
app.get('/idCheck', async (req,res)=>{
    const { id } = req.query;
    let data = await Member.find({id:id})
    if(data.length > 0){
        res.json(true)
    } else{
        res.json(false)
    }

})
// 닉네임 중복확인
app.get('/nickCheck', async (req,res)=>{
    const { nick } = req.query;
    let data = await Member.find({nick:nick})
    if(data.length > 0){
        res.json(true)
    } else{
        res.json(false)
    }
})

app.get('/myInfoGet', async (req,res)=>{
    const { userKey } = req.query;
    let data = await Member.findOne({key:userKey})

    res.json(data)
})


// 프로필 사진 업데이트
app.put('/profileImgPost', upload.single('profileImg'), async(req, res) => {
    const {userKey} = req.query;
    await Member.updateOne({key : userKey}, { $set: {profileImg : req.file}});
    res.send(req.files);
});

// 한줄소개 업데이트
app.put('/profileIntro', async(req, res) => {
    const qData = req.body;
    await Member.updateOne({key : qData.userKey}, { $set: {intro : qData.intro}});
    res.json('')
});




// 레시피등록
app.post('/recipe', async (req, res) => {
    
    const qData = req.body;

    await Recipe.create(qData);

    res.json('');
})


// 레시피 가져오기
app.get('/recipeGet', async (req,res)=>{
    const {searchQuery, categoryQuery} = req.query
    if(searchQuery && searchQuery !== "null"){
        let data = await Recipe.find({title : { $regex: searchQuery }});
        res.json(data)
    } else if(categoryQuery === "전체"){
        let data = await Recipe.find();
        res.json(data)
    } else if(categoryQuery){
        let data = await Recipe.find({category :categoryQuery });
        res.json(data)
    } 
    else{
        let data = await Recipe.find();
        res.json(data)
    }
    
})


app.get('/bestRecipeList', async (req,res)=>{
    const {searchQuery, categoryQuery} = req.query
    let data = await Recipe.find({});


    let best = data.sort((a,b)=> b.favorite - a.favorite).slice(0,4);

    res.json(best)
    
})


// 레시피 디테일 가져오기
app.get('/recipeDetail', async (req,res)=>{
    const { recipeKey } = req.query;

    let data = await Recipe.findOne({recipeKey : recipeKey});
    res.json(data)  
})



// 조리순서 이미지 포스트
app.post('/stepImgUpload', upload.array('postImg', 10), async(req, res) => {

    await StepImg.create(req.files);
    res.send(req.files);
});


// 레시피 썸네일 이미지 포스트
app.post('/thumbnailImgUpload', upload.single('thumbnail'), async(req, res) => {
    await Thumbnail.create(req.file);
    res.send(req.file);
});


// 레시피 썸네일 이미지 가져오기
app.get('/thumbnail', async(req, res)=>{
    const { recipeKey } = req.query;
    let data = await Thumbnail.findOne({originalname : { $regex: recipeKey }});
    res.json(data)  
})


// 조리순서 이미지 가져오기
app.get('/stepImg', async(req, res)=>{
    const { recipeKey } = req.query;
    let data = await StepImg.find({originalname : { $regex: recipeKey }});

    res.json(data)  
})




// 조회수 업데이트
app.put('/view', async(req, res)=>{
    const { recipeKey } = req.query;

    let data = await Recipe.updateOne({recipeKey : recipeKey}, { $inc: {view: 1 }}); // $inc <- 몽고디비에서 필드값 증가시키는 역할

    res.json("")  
})





// 즐겨찾기 가져오기
app.get('/favoriteGet', async(req, res)=>{
    const { recipeKey, userKey  } = req.query;
    let data = await Favorite.findOne({recipeKey : recipeKey, userKey : userKey });
    let favLeng = await Favorite.find({recipeKey : recipeKey });

    if(data){
        res.json({favValue : true, favLeng : favLeng.length})  
    } else{
        res.json({favValue : false, favLeng : favLeng.length})  
    }

})


//  즐겨찾기 추가
app.post('/favoritePost', async(req, res)=>{
    const qData = req.body;

    await Favorite.create(qData);

    res.json("")  
})

//  즐겨찾기 삭제
app.delete('/favoriteDel', async(req, res)=>{
    const { recipeKey, userKey  } = req.query;

    await Favorite.deleteOne({recipeKey : recipeKey, userKey : userKey}); 

    res.json("")  
})

//  즐겨찾기 업데이트
app.put('/favoriteUpdate', async(req, res)=>{
    const { recipeKey, favLeng  } = req.query;

    await Recipe.updateOne({recipeKey : recipeKey},{ $set:{favorite : parseInt(favLeng)}}); 

    res.json("")  
})





// 댓글 가져오기
app.get('/commentGet', async(req, res)=>{
    const { recipeKey, userKey  } = req.query;
    let data = await Comment.find({recipeKey : recipeKey });

    res.json(data)  
})


//  댓글 추가
app.post('/commentPost', async(req, res)=>{
    const qData = req.body;

    await Comment.create(qData);

    res.json("")  
})

//  댓글 삭제
app.delete('/commentDel', async(req, res)=>{
    const { commentKey  } = req.query;

    await Comment.deleteOne({commentKey : commentKey}); 

    res.json("")  
})



// 내 레시피 가져오기
app.get('/myWriteRecipe', async(req, res)=>{
    const { userKey  } = req.query;
    let data = await Recipe.find({ 'userInfo.key': userKey });

    res.json(data)  
})


app.get('/myFavoriteRecipe', async(req, res)=>{
    const { userKey  } = req.query;
    let data = await Recipe.find({ 'userInfo.key': userKey });

    res.json(data)  
})

app.get('/myFavoriteInfo', async(req, res)=>{
    const { userKey  } = req.query;
    let data = await Favorite.find({ userKey : userKey });

    res.json(data)  
})











// 전체삭제 테스트
app.delete('/del', async(req, res)=>{
    await StepImg.deleteMany();
    await Thumbnail.deleteMany();
    await Recipe.deleteMany();
    res.json('')  
})



// 테스트
app.get('/img', async (req,res)=>{
    const { objKey } = req.query;

    let data = await Step.find({ originalname: { $regex: objKey } }); //  $regex정규식  $regex: objKey이렇게하면 originalname에 objKey값이 포함하는 값 찾는 정규식
    res.json(data)
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})