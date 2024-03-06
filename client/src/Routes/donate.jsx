import React from 'react';
import "../Styles/Home.css";

function Donate() {
    return (
        <div className="home-grid-container">
            <div className="title-container-donate">
                <h1 className="spartan-title-donate">DONATE</h1>
            </div>
            <div className="description-container-home">
                <p className="spartan-description-donate">
                    <span style={{ fontSize: 'larger', padding: 0 }}>
                        <p style={{ color: "#ffffff" }}>Donate to Spartan Report</p>
                    </span>
                    This service will remain free to use as long as we can keep up with server costs. Please consider donating to help keep this project going!
                </p>
                {/* New section about the $5 donation */}
                <div className="donation-impact">
                    <p className="spartan-description-donate">
                        A <strong>$5 donation</strong> will help Spartan Report run smoother and will let us expand on the current feature offerings!
                    </p>
                </div>
            </div>

            <div className="donate-buttons">
                
                <a href="https://www.paypal.com/donate/?hosted_button_id=KL2JTNKLF43AN" target="_blank" rel="noopener noreferrer">
                    <button className="btn paypal-btn">Donate with PayPal (One Time Donation)</button>
                </a>
            </div>
        </div>
    );
}

export default Donate;
