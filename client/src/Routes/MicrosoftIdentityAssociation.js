import React, { useState, useEffect } from 'react';

function MicrosoftIdentityAssociation() {

    // Route to backend
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    // /.well-known/microsoft-identity-association.json
    window.location.href = apiUrl+ "/.well-known/microsoft-identity-association.json"; 

      
}
export default MicrosoftIdentityAssociation;