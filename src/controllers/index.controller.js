const controller = {}
const title= 'INDEX DESDE EL SERVIDOR CON PUG desde el INDEX'

controller.index = (req, res)=>{//ruta a la que se esta accediendo y los metodos que se ejecutaran
    res.render('index', {title})
}

module.exports = controller