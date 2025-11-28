import React from "react";

const TITULOS = [
  "Recepción",
  "Emisión",
  "N° Documento",
  "Tipo",
  "Emisor",
  "Receptor",
  "Estado",
  "Monto Total"
];

const ResultadosTabla = ({ data }) => (
  <div className="resultados-tabla">
    <div className="titulos-columnas-fijas">
      {TITULOS.map((titulo, idx) => (
        <div className="titulo-columna-fija" key={idx}>{titulo}</div>
      ))}
    </div>
    <div className="tabla-scroll">
      <table>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.recepcion}</td>
              <td>{row.emision}</td>
              <td>{row.doc}</td>
              <td>{row.tipo}</td>
              <td>{row.emisor}</td>
              <td>{row.receptor}</td>
              <td>{row.estado}</td>
              <td>{row.monto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ResultadosTabla; 