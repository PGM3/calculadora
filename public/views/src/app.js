//Semantic verdioning: MAJOR. MINOR.PATH
//req = request -> Peticion del cliente
//res = response -> respuesta del servidor
//cliente = navegador

const express = require('express')
const app = express()
const path = require('path')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))//views es de parametro, el segundo es el nombre de la carpeta

app.use(require('./routes/index.route'))

//STATIC FILES

app.use(express.static(path.join(__dirname,'../public')))


app.use((req,res)=>{
    res.sendFile(path.join(__dirname,'../public/index.html'))
})


app.listen(3000, ()=>{
    console.log('Servidor a la espera de conexiones')
})

