import React from 'react';

const Footer = () => {
    return (
        <footer style={{ textAlign: 'center', padding: '0.01rem', background: '#F4BDBC', marginTop: '50px', borderTop: '1px solid #663b2b' }}>
            <p style={{color: "#663b2b", fontWeight:"bold", fontSize: "20px"}}>&copy; {new Date().getFullYear()} Anjos Bolos. Todos os direitos reservados.</p>
        </footer>
    );
};

export default Footer;