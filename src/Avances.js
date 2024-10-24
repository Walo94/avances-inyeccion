import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Avances.css';

const socket = io('http://localhost:5000');

const ModuloAvance = ({ modulo, avance, meta, horas }) => {
  return (
    <div className="modulo-container">
      <h2 className="modulo-title">{modulo}</h2>
      <div className="meta-info">
        <span className="pares-hora">Pares x Hora: {meta}</span>
        <span className="meta-total">Meta: 1100</span>
      </div>
      <div className="horas-avances-container">
        <div className="horas-container">
          {horas.map((hora, index) => (
            <span key={index} className="hora-text">{hora}</span>
          ))}
        </div>
        <div className="avances-container-horizontal">
          {avance.map((valorAvance, index) => (
            <div key={index} className={`avance-box ${valorAvance >= meta ? 'green' : 'red'}`}>
              {valorAvance}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Avances = () => {
  const [data, setData] = useState([]);
  const meta = 100;
  const fechaActual = new Date().toLocaleDateString();
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  const horas = Array.from({ length: 11 }, (_, i) => i + 8);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get('http://localhost:5000/avances');
      console.log('Datos recibidos:', result.data);
      setData(result.data);
    };

    fetchData();

    // Solicitar avances al conectarse
    socket.on('connect', () => {
      socket.emit('solicitar_avances'); // Solicitar datos iniciales
    });

    socket.on('nueva_actualizacion', (newData) => {
      setData(newData); // Actualiza el estado con los nuevos datos
    });

    return () => {
      socket.off('nueva_actualizacion'); // Limpia el listener al desmontar el componente
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHoraActual(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })); // Actualiza la hora en formato 24 horas
    }, 1000);

    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
  }, []);

  const mapAvances = (modulo, fechaKey) => {
    return horas.map((hora) => {
      const registros = data[modulo]?.filter((d) => {
        const fecha = new Date(d[fechaKey]);
        const registroHora = fecha.getUTCHours();
        return registroHora === hora && d[fechaKey] !== null; // Comparar con la hora actual
      }) || [];

      const total = registros.reduce((sum, curr) => sum + (curr.npares || 0), 0);
      return total; // Retorna el total (será 0 si no hay registros)
    });
  };

  return (
    <div className="container">
      <div className="header">
      <span className="fecha">Fecha: {fechaActual} - {horaActual}</span>
        <span className="fecha"></span>
        <h1 className="title">Avances por Módulo</h1>
      </div>
      <div className="modulos-grid">
        <ModuloAvance 
          modulo="INYECCION" 
          avance={mapAvances('inyeccion', 'fecha_inyeccion')} 
          meta={meta} 
          horas={horas} 
        />
        <ModuloAvance 
          modulo="ADORNO" 
          avance={mapAvances('adorno', 'fecha_adorno')} 
          meta={meta} 
          horas={horas} 
        />
      </div>
    </div>
  );
};

export default Avances;
