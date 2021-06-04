const express = require('express')
const nunjucks = require('nunjucks')
const poketo = require('poketo')

const app = express()
const port = 3000

nunjucks.configure('views', {
    autoescape: true,
    express: app
});
app.use('/public', express.static(__dirname + '/static'));
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
    console.log("request for home")
    res.render('index.njk')
}, error=> {
    console.log(error.message)
})

app.post('/', (req, res) => {
    console.log(req.body)
    let manga = req.body.manga
    let chapter = req.body.chapter
    let manganame = manga.split(' ').join('_')
    let pad = "000"
    let chapternum = pad.substring(0, pad.length - chapter.length) + chapter
    res.redirect('/'+manganame+'/'+chapternum)
})

app.get('/:manganame/:chapternum', (req, res) => {
    let output = []
    let chapterurl = poketo.constructUrl('manga-fox:' + req.params.manganame + ':c' + req.params.chapternum)
    console.log('request for : ' + chapterurl)

    poketo.getChapter(chapterurl).then(chapter => {
        chapter.pages.forEach((o) => {
            output.push(o.url)
        })
        console.log(output)
        res.render('page.njk', {output : output, manga : req.params.manganame, chapter : req.params.chapternum})
    }, error => {
        res.render('error.njk', { message : 'no such manga chapter exists, try using the japanese name of manga' })
    })
}, error=> {
    console.log(error.message)
})

app.listen(port, () => {
    console.log('listening on port ' + port)
})