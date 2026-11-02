import { useState } from 'react';

export function Produto(props) {
        const [contador, setContador] = useState(0);

        const aumentar = () => setContador(contador + 1);
        const diminuir = () => setContador(contador > 0 ? contador - 1 : 0);

        const clickAumentar = () => {
            if (props.tipo === "festa" && contador >= 1) {
                return;
            }
            props.onAdd();
            aumentar();
        };

        const clickDiminuir = () => {
            if (contador > 0) {
            props.onRemove();
            diminuir();
            }
        };

        return (
            <div>
                <div style={{ textAlign: 'center' }}>
                    <h5 style={{ color: 'black' }}>{props.titulo}</h5>
                    <img onClick={clickAumentar} src={props.imagem} alt={props.titulo} style={{ width: '120px', height: '120px', borderRadius: '10px', border: '4px solid #663b2b', cursor: 'pointer'}} />
                    <h5 style={{ color: '#56270B', marginTop:'0', marginBottom:'0' }}>R$ {props.valor}</h5>
                    <div style={{ marginTop: '10px', marginBottom: '0' }}>
                        <span style={{ margin: '0 10px 0 0', color: '#56270B', fontSize: '20px', fontWeight: 'bold' }}>Qtd.</span>
                        <button onClick={clickDiminuir} style={{ borderRadius:'35px', width: '7px', backgroundColor:'#56270B', padding: '0px 13px 0px 8px', fontWeight: 'bold', fontSize: ''}}>-</button>
                        <span style={{ margin: '0 10px', color: 'black', fontSize: '18px', fontWeight: 'bold', paddingTop: '10px' }}>{contador}</span>
                        <button disabled={props.tipo === "festa" && contador >= 1} onClick={clickAumentar} style={{ borderRadius:'35px', width: '15px', backgroundColor:'#56270B', padding: '0px 15px 0px 6px', fontWeight: 'bold'}}>+</button>
                    </div>
                </div>
            </div>
        );
}
