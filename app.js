const express = require('express')
const cookieParser = require('cookie-parser')
const nunjucks = require('nunjucks')
const poketo = require('poketo')
const moment = require('moment')

const app = express()
const port = 3000

nunjucks.configure('views', {
    autoescape: true,
    express: app
});
app.use(cookieParser())
app.use('/public', express.static(__dirname + '/static'))
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
    console.log("get request for home")
    res.render('index.njk')
}, error=> {
    console.log(error.message)
})

app.post('/', (req, res) => {
    console.log('post request for : ' + req.body.manga)
    let manga = req.body.manga
    let manganame = manga.split(' ').join('_')
    res.redirect('/'+manganame)
})

app.get('/recents', (req, res) => {
    console.log("get request for recents")
    let output = {}
    if(req.headers.cookie) {
        req.headers.cookie.split(';').forEach(o => {
            let spl = o.split('=')
            output[spl[0].trim().split('_').join(' ')] = parseFloat(spl[1])
        })
        console.log(output)
    }
    res.render('recents.njk', {output : output})
}, error=> {
    console.log(error.message)
})

app.post('/recents', (req, res) => {
    console.log('post request for : ' + req.body.manga)
    res.clearCookie(req.body.manga)
    res.render('recents.njk')
})

app.get('/:manganame', (req, res) => {
    let output = []
    let seriesurl = poketo.constructUrl('manga-fox:' + req.params.manganame)
    console.log('get request for : ' + seriesurl)

    poketo.getSeries(seriesurl).then(series => {
        series.chapters.forEach((o) => {
            output.push({ number: o.chapterNumber? o.chapterNumber : 0, title: o.title? o.title.split('&apos;').join('\''): '', time : moment.duration(Date.now()/1000 - o.createdAt, 'seconds').humanize() });
        })
        console.log(output)
        res.render('manga.njk', {output : output, manga : req.params.manganame.split('_').join(' '), author : series.author, description : series.description, cover : series.coverImageUrl, status : series.status});
    }, error => {
        res.render('error.njk', { message : 'that manga series does not exist, try using the japanese name of manga' })
    })
}, error=> {
    console.log(error.message)
})

app.get('/:manganame/:chapternum', (req, res) => {
    let output = []
    let pad = "000"
    let chap = pad.substring(0, pad.length - req.params.chapternum.length) + req.params.chapternum
    let chapterurl = poketo.constructUrl('manga-fox:' + req.params.manganame + ':c' + chap)
    console.log('get request for : ' + chapterurl)

    let serieslist = []
    let prev
    let next
    let seriesurl = poketo.constructUrl('manga-fox:' + req.params.manganame)
    poketo.getSeries(seriesurl).then(series =>{
        series.chapters.forEach((o) => {
            serieslist.push(o.chapterNumber? o.chapterNumber : 0)
        })
        let index = serieslist.lastIndexOf(parseFloat(req.params.chapternum).toString())
        prev = serieslist[index+1] ? serieslist[index+1]: 'no'
        next = serieslist[index-1] ? serieslist[index-1]: 'no'
        // console.log(req.params.chapternum, serieslist, index ,prev, next)
    })

    poketo.getChapter(chapterurl).then(chapter => {
        chapter.pages.forEach((o) => {
            output.push(o.url)
        })
        console.log(output)
        res.cookie(req.params.manganame, parseFloat(req.params.chapternum))
        res.render('page.njk', {output : output, manga : req.params.manganame, chapter : req.params.chapternum, prev: prev, next: next})
    }, error => {
        res.render('error.njk', { message : 'that manga chapter does not exist' })
    })
}, error=> {
    console.log(error.message)
})

app.listen(port, () => {
    console.log('listening on port ' + port)
})