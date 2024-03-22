// Object Card is the individual card rendered for each armor piece in the Armory Row
import {useEffect, useRef, useState} from "react";
import checkmark from '../checkmark.svg';
import axios from "axios";
import fetchImage from "./ProxyFetchImage";




async function fetchImageFromDB(gamerInfo,path) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
        // if path contains substring "Progression/Cores/", return null
        if (path === undefined || path === ""){
            return null;
        }

        if (path.toLowerCase().includes("progression/cores/")) {
            return null;
        }

        console.log("Fetching image from DB: ", path)

        // if path contains Cores or ArmorCore or ArmorCores, fetch from elsewhere
        if (path.includes("Cores") || path.includes("ArmorCore") || path.includes("ArmorCores")) {
            const imgSrc = await fetchImage("hi/images/file/" + path, gamerInfo.spartankey);
            return imgSrc;
        }
        let payload = {
            ImagePath: path
        }

        const response = await axios.post(`${apiUrl}/getItemImage`, payload);
        return response.data

    } catch (error) {
        console.error('Fetching image failed:', error);
        return null;
    }
}


/**
 * Renders a card component for an armor piece.
 *
 * @param {Object} props - The component props.
 * @param {number} props.customKitCount - The count of custom kits.
 * @param {function} props.setCustomKitCount - The function to set the count of custom kits.
 * @param {string} props.editingObjectId - The ID of the armor piece being edited.
 * @param {function} props.onEditingChange - The function to handle editing mode change.
 * @param {function} props.onClickCustomKit - The function to handle click on custom kit.
 * @param {Object} props.gamerInfo - The gamer information.
 * @param {Object} props.object - The armor piece data.
 * @param {boolean} props.isHighlighted - Indicates if the armor piece is highlighted.
 * @param {function} props.onClick - The function to handle click on the armor piece.
 * @param {function} props.onNameChange - The function to handle name change.
 * @param {function} props.onImageChange - The function to handle image change.
 * @param {function} props.onRemove - The function to handle removal of the armor piece.
 * @returns {JSX.Element} The rendered ObjectCard component.
 */
const ObjectCard = ({customStyle, customKitCount, setCustomKitCount, editingObjectId, onEditingChange, onClickCustomKit, gamerInfo, object, isHighlighted, onClick, onNameChange, onImageChange, onRemove }) => {
    // States for the image source, editing mode, and the current image index
    const [copied, setCopied] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentImageIndexType, setCurrentImageIndexType] = useState("");
    const [kitName, setKitName] = useState("");
    const [equippedImages, setEquippedImages] = useState([]);
    const [equippedTypes, setEquippedTypes] = useState([]);
    const [isInView, setIsInView] = useState(false);
    const cardRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (object.Image === undefined && object.Type === "ArmorKitCustom"){
                            let imgType = object.ImageType;
                            // For each object in object.currentlyEquipped, fetch the image from the database if the type matches the img Type and set object.Image to it
                            for (const [key, value] of Object.entries(object.currentlyEquipped)) {
                                console.log("Checking custom kit: ", value.Type, " vs ", imgType)
                                if (value.Type === imgType){
                                    fetchImageFromDB(gamerInfo,value.CorePath).then((response) => {
                                        if (response === null){
                                            return;
                                        }
                                        setImageSrc(object.Image ? `data:image/png;base64,${response.imageData}` : null);
                                    });
                                }
                            }
                        }
                        else if (object.Image === undefined){
                            fetchImageFromDB(gamerInfo,object.CorePath).then((response) => {
                                if (response === null){
                                    return;
                                }
                                object.Image = response.imageData;
                                setImageSrc(response.imageData);
                            });
                        }
                        setIsInView(true); // Set state to indicate the object is in view
                    } else {
                        setIsInView(false); // Set state to indicate the object is not in view
                    }
                });
            },
            { threshold: 0.1 } // Adjust threshold as needed to trigger when the object is in view
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [object,object.Type]); // Depend on `object` to re-attach observer if the object changes
    const inputRef = useRef(null);
    // If the object is a custom kit, get the images of the currently equipped items so we can cycle through them on the card in edit mode
    useEffect(() => {
        if (object.Type === "ArmorKitCustom") {
            console.log("Object is custom kit!", object.currentlyEquipped);

            // Initialize arrays to store the images and types
            const newEquippedImages = [];
            const newEquippedTypes = [];

            // Process each item in the currently equipped items of the custom kit
            const processEquippedItems = async () => {
                const equippedItems = Object.values(object.currentlyEquipped).filter(eq => eq);

                for (const eq of equippedItems) {
                    if (eq.Image === undefined) {
                        // If Image is undefined, fetch it from the database
                        const response = await fetchImageFromDB(gamerInfo,eq.CorePath);
                        if (response === null ){
                            continue;
                        }
                        eq.Image = response.imageData; // Update the item's Image with the fetched data
                    }
                    // Push the updated image and type to the arrays
                    newEquippedImages.push(eq.Image);
                    newEquippedTypes.push(eq.Type);
                }

                // After processing all items, update the state
                setEquippedImages(newEquippedImages);
                setEquippedTypes(newEquippedTypes);
                setKitName(object.name);
            };

            // Execute the asynchronous function to process the equipped items
            processEquippedItems();
        }
    }, [object]); // Depend on `object`, so this runs only when `object` changes
    // Fetch Higher Resolution Image if the object is highlighted
    useEffect(() => {
        async function loadImage() {
            if (object.ImagePath === undefined && object.ImagePath === "" && object.CorePath === ""){
                console.log("Object Paths undefined: ", object)
            }
            if (typeof object.id === 'string' && object.id.startsWith('saveLoadout')) {
                console.log(object)
                let imgType = object.ImageType;
                // search currentlyequipped
                for (const [key, value] of Object.entries(object.currentlyEquipped)) {
                    if (value === null){
                        continue;
                    }
                    if (value.Type === imgType){
                        fetchImageFromDB(gamerInfo,value.CorePath).then((response) => {
                            if (response === null){
                                return;
                            }
                            object.Image = response.imageData;
                            setImageSrc(object.Image ? `data:image/png;base64,${object.Image}` : null);
                        });
                    }
                }
                setImageSrc(object.Image ? `data:image/png;base64,${object.Image}` : null);
            }
            else if (object.ImagePath && gamerInfo.spartankey && object.isHighlighted  && object.Type !== "ArmorCore") {
                const imgSrc = await fetchImage("hi/images/file/" + object.ImagePath, gamerInfo.spartankey);
                if (object.Type === "ArmorCore"){
                    console.log("checking armor core")
                }
                if (imgSrc === null || imgSrc === undefined){
                    console.log("is null")
                    return;
                }
                setImageSrc(imgSrc);
            } else if (object.Type === "ArmorCore") {
                const imgSrc = await fetchImage("hi/images/file/" + object.CorePath, gamerInfo.spartankey);
                if (imgSrc === null || imgSrc === undefined){
                    console.log("is null")
                    return;
                }
                setImageSrc(imgSrc);

            }else{
                setImageSrc(`data:image/png;base64,${object.Image}`);
            }
        }
        loadImage();
    }, [object, gamerInfo.spartankey, object.Image]);

    // Focus the input field when the card enters edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current?.focus();
        }
    }, [isEditing]);
    // UseEffect to respond to changes in isEditing prop
    useEffect(() => {
        setIsEditing(editingObjectId === object.id);
    }, [editingObjectId, object.id]);

    // Function to cycle through the images of the currently equipped items
    const cycleImage = (direction) => {
        let newIndex = currentImageIndex + (direction === 'next' ? 1 : -1);
        if (newIndex < 0) newIndex = equippedImages.length - 1;
        if (newIndex >= equippedImages.length) newIndex = 0;
        console.log("Equipped Images: ", equippedImages);
        setCurrentImageIndexType(equippedTypes[newIndex])
        setCurrentImageIndex(newIndex);
        // Update the image of the card
        onImageChange(object.id, equippedTypes[newIndex]);
    };

    // Function to handle the name change of the custom kit
    const handleNameChange = (event) => {
        const newName = `${event.target.value}`; // Reconstruct the full name with the index
        setKitName(newName);
        onNameChange(object.id, newName);
    };

    // Function to toggle the edit mode
    const handleEditToggle = (event) => {
        event.stopPropagation(); // Prevents the event from bubbling up
        // Toggle the edit mode based on whether this card's ID matches the editingObjectId
        const newIsEditing = editingObjectId === object.id ? false : true;
        onEditingChange(newIsEditing, object.id, currentImageIndex,currentImageIndexType,kitName);
    };

    // Handles Enter key press to "save" the custom kit name
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            setIsEditing(!isEditing);
            const newIsEditing = editingObjectId === object.id ? false : true;
            onEditingChange(newIsEditing, object.id, currentImageIndex,currentImageIndexType,kitName);
        }
    };

    // Handles removal of custom kit
    const handleRemoveCard = () => {
        setCustomKitCount(customKitCount - 1);
        onRemove(object.id);
        setIsEditing(false);
        onEditingChange(false, !isEditing ? object : null);

    };

    // Check to see if card passed in is a Custom Kit
    const isDummyObject = typeof object.id === 'string' && object.id.startsWith('saveLoadout');
    // If the object is a custom kit, we want to allow editing, but not if the card being passed in is the "Save Loadout" card template
    const isEditableDummyObject = isDummyObject && object.id !== 'saveLoadout';
    const rarityClass = object.Rarity;
    const imageClassName = isHighlighted ? 'highlightedImage' : 'unhighlightedImage';
    if (object.CustomStyle !== undefined){
        customStyle = object.CustomStyle;
    }
    const cardClassName = `${isHighlighted ? 'highlightedObjectCardRow' : `objectCard ${customStyle}`} cardWithGradient ${rarityClass}`;
    const svgContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', width: '185px' };

    // Determine the click handler based on if the card is in edit mode or not
    const handleCardClick = () => {
        if (isEditableDummyObject && !isEditing) {
            onClickCustomKit(object);
        } else  {
            onClick(object);
        }
    };

    const handleGetLink = async (event) => {
        event.stopPropagation(); // Prevents the event from bubbling up to parent elements
        try {
            // get current url domain and point to /customkit/kitId/xuid
            const url = window.location.origin + `/customkit/${object.id}/${gamerInfo.xuid}`;

            await navigator.clipboard.writeText(url);
            setCopied(true); // Update the state to indicate copy action has been performed
            setTimeout(() => setCopied(false), 2000); // Reset state after 2 seconds
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
    const editableName = object.name
    // if object.CustomStyle exists, set customStyle to object.CustomStyle

    return (
        <div ref={cardRef} className={cardClassName} onClick={handleCardClick}>
            {isEditableDummyObject && isEditing ? (
                <>
                    <input
                        type="text"
                        value={editableName}
                        onKeyDown={handleKeyDown}
                        onChange={handleNameChange}
                        ref={inputRef}
                        className="dummy-object-name-input"
                    />
                    {currentImageIndex > 0 && (
                        <button onClick={() => cycleImage('prev')} className="cycle-button-prev">
                            &lt;
                        </button>
                    )}
                    {currentImageIndex < equippedImages.length - 1 && (
                        <button onClick={() => cycleImage('next')} className="cycle-button-next">
                            &gt;
                        </button>
                    )}
                </>
            ) : (
                <p className='card-subheader-mini'>{object.name}</p>
            )}
            {imageSrc !== null ? (
                <img src={imageSrc} alt={object.name} className={`${imageClassName} ImageCard`} />
            ) : (
                typeof object.id === 'string' && object.id.startsWith('saveLoadout') && (
                    <div style={svgContainerStyle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" fill="#4389BA" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                        </svg>
                    </div>
                )
            )}
            {isEditableDummyObject && (
                <button onClick={(event) => handleEditToggle(event)} className={`checkmark-button ${isEditing ? 'checkmark-button-editing' : ''}`}>
                    {isEditing ? (
                        <img src={checkmark} className="checkmark-editing" alt="Completed" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="10px" width="20" height="20" viewBox="0 0 50 50">
                            <path d="M 43.125 2 C 41.878906 2 40.636719 2.488281 39.6875 3.4375 L 38.875 4.25 L 45.75 11.125 C 45.746094 11.128906 46.5625 10.3125 46.5625 10.3125 C 48.464844 8.410156 48.460938 5.335938 46.5625 3.4375 C 45.609375 2.488281 44.371094 2 43.125 2 Z M 37.34375 6.03125 C 37.117188 6.0625 36.90625 6.175781 36.75 6.34375 L 4.3125 38.8125 C 4.183594 38.929688 4.085938 39.082031 4.03125 39.25 L 2.03125 46.75 C 1.941406 47.09375 2.042969 47.457031 2.292969 47.707031 C 2.542969 47.957031 2.90625 48.058594 3.25 47.96875 L 10.75 45.96875 C 10.917969 45.914063 11.070313 45.816406 11.1875 45.6875 L 43.65625 13.25 C 44.054688 12.863281 44.058594 12.226563 43.671875 11.828125 C 43.285156 11.429688 42.648438 11.425781 42.25 11.8125 L 9.96875 44.09375 L 5.90625 40.03125 L 38.1875 7.75 C 38.488281 7.460938 38.578125 7.011719 38.410156 6.628906 C 38.242188 6.246094 37.855469 6.007813 37.4375 6.03125 C 37.40625 6.03125 37.375 6.03125 37.34375 6.03125 Z"></path>
                        </svg>
                    )}
                </button>
            )}
            {isEditableDummyObject && isEditing && (
                <>

                    <button onClick={handleRemoveCard} className="trash-button">
                        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.5001 6H3.5" stroke="#1C274C" stroke-width="1.5" strokeLinecap="round" />
                            <path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5" stroke="#1C274C" stroke-width="1.5" strokeLinecap="round" />
                            <path d="M9.5 11L10 16" stroke="#1C274C" stroke-width="1.5" strokeLinecap="round" />
                            <path d="M14.5 11L14 16" stroke="#1C274C" stroke-width="1.5" strokeLinecap="round" />
                            <path d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="#1C274C" stroke-width="1.5" />
                        </svg>
                    </button>
                </>

            )}

            {isEditableDummyObject && !isEditing && (
                <>
                    <button onClick={handleGetLink} className="link-button">
                        {copied ? "Copied!" : (
                            <svg width="24px" height="24px" viewBox="0 0 24.00 24.00" version="1.1"
                                 fill="#000000">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"
                                   stroke="#CCCCCC" stroke-width="0.24000000000000005"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none"
                                       fill-rule="evenodd">
                                        <g id="ic_fluent_copy_link_24_regular" fill="#212121" fill-rule="nonzero">
                                            <path
                                                d="M13.7533481,2 C14.9105985,2 15.863488,2.8749731 15.9865561,3.9994587 L17.75,4 C18.940864,4 19.9156449,4.92516159 19.9948092,6.09595119 L20,6.25 L20,12.25 C20,12.6642136 19.6642136,13 19.25,13 C18.8703042,13 18.556509,12.7178461 18.5068466,12.3517706 L18.5,12.25 L18.5,6.25 C18.5,5.87030423 18.2178461,5.55650904 17.8517706,5.50684662 L17.75,5.5 L15.6182905,5.49983563 C15.214809,6.09910034 14.5301141,6.49330383 13.7533481,6.49330383 L10.2466519,6.49330383 C9.46988587,6.49330383 8.78519098,6.09910034 8.38170952,5.49983563 L6.25,5.5 C5.87030423,5.5 5.55650904,5.78215388 5.50684662,6.14822944 L5.5,6.25 L5.5,19.754591 C5.5,20.1342868 5.78215388,20.448082 6.14822944,20.4977444 L6.35177056,20.5114376 C6.71784612,20.5611 7,20.8748952 7,21.254591 C7,21.6688046 6.66421356,22.004591 6.25,22.004591 C5.05913601,22.004591 4.08435508,21.0794294 4.00519081,19.9086398 L4,19.754591 L4,6.25 C4,5.05913601 4.92516159,4.08435508 6.09595119,4.00519081 L6.25,4 L8.01344395,3.9994587 C8.13651196,2.8749731 9.08940148,2 10.2466519,2 L13.7533481,2 Z M17.25,14.5 L18.25,14.5 C20.3210678,14.5 21.9999918,16.1789322 21.9999918,18.25 C21.9999918,20.2542592 20.4276389,21.8912737 18.4522792,21.994802 L18.2534432,22 L17.2534432,22.0045992 C16.839234,22.0064847 16.5019095,21.6722434 16.4999918,21.2580342 C16.4982641,20.8783424 16.778975,20.5632552 17.1448187,20.5119127 L17.2465568,20.5045989 L18.25,20.5 C19.4926407,20.5 20.4999918,19.4926407 20.4999918,18.25 C20.4999918,17.059136 19.5748384,16.0843551 18.4040488,16.0051908 L18.25,16 L17.25,16 C16.8357864,16 16.4999918,15.6642136 16.4999918,15.25 C16.4999918,14.8703042 16.7821539,14.556509 17.1482294,14.5068466 L17.25,14.5 L18.25,14.5 L17.25,14.5 Z M12.25,14.5 L13.25,14.5 C13.6642136,14.5 14,14.8357864 14,15.25 C14,15.6296958 13.7178461,15.943491 13.3517706,15.9931534 L13.25,16 L12.25,16 C11.0073593,16 10,17.0073593 10,18.25 C10,19.440864 10.9251616,20.4156449 12.0959512,20.4948092 L12.25,20.5 L13.25,20.5 C13.6642136,20.5 14,20.8357864 14,21.25 C14,21.6296958 13.7178461,21.943491 13.3517706,21.9931534 L13.25,22 L12.25,22 C10.1789322,22 8.5,20.3210678 8.5,18.25 C8.5,16.2457408 10.0723611,14.6087263 12.0508414,14.505198 L12.25,14.5 L13.25,14.5 L12.25,14.5 Z M12.25,17.5 L18.25,17.5 C18.6642136,17.5 19,17.8357864 19,18.25 C19,18.6296958 18.7178461,18.943491 18.3517706,18.9931534 L18.25,19 L12.25,19 C11.8357864,19 11.5,18.6642136 11.5,18.25 C11.5,17.8703042 11.7821539,17.556509 12.1482294,17.5068466 L12.25,17.5 L18.25,17.5 L12.25,17.5 Z M13.7533481,3.5 L10.2466519,3.5 C9.83428745,3.5 9.5,3.83428745 9.5,4.24665191 C9.5,4.65901638 9.83428745,4.99330383 10.2466519,4.99330383 L13.7533481,4.99330383 C14.1657126,4.99330383 14.5,4.65901638 14.5,4.24665191 C14.5,3.83428745 14.1657126,3.5 13.7533481,3.5 Z"
                                                id="🎨-Color"></path>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        )}
                    </button>
                </>

            )}
        </div>
    );
};


export default ObjectCard;