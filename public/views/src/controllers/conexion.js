let mysql = require("mysql2");

let conexion = mysql.createConnection({
        host: 'localhost',
        database: "calculadorasfv",
        user: 'root',
        password: ''
 });

 conexion.connect(function(error){
    if(error){
        throw error;
    }else{
        console.log("Conectado a la base de datos");
    }
 });

 conexion.end();