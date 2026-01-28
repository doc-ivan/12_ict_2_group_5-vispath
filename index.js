// Imports //
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth, 
        onAuthStateChanged,
        signOut,
        GoogleAuthProvider,
        signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { 
        getDatabase, 
        ref, 
        onValue, 
        set,  
        onDisconnect,
        serverTimestamp as fsServerTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import { getFirestore, 
        collection, 
        addDoc, 
        updateDoc, 
        serverTimestamp, 
        arrayUnion,
        onSnapshot, 
        query, 
        where, 
        orderBy, 
        doc,
        getDocs,
        getDoc,
        setDoc,
        increment,
        limit, 
        startAfter,
        Timestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase Setup //
const firebaseConfig = {
    apiKey: "AIzaSyD2MsAl5e9BX2Q6xzgFlsvkzGdkLZogTdQ",
    authDomain: "visionpath-33d48.firebaseapp.com",
    projectId: "visionpath-33d48",
    storageBucket: "visionpath-33d48.firebasestorage.app",
    messagingSenderId: "371488038314",
    appId: "1:371488038314:web:b6e3ab9c93bca867b8dfd3",
    databaseURL: "https://visionpath-33d48-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase //
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DB = getDatabase(app);   
const provider = new GoogleAuthProvider();

const navLinks = document.querySelectorAll('.nav-link')
const sections = document.querySelectorAll(".sections")
const homeSection = document.getElementById("home-section")
const searchSection = document.getElementById("search-section")
const shareSection = document.getElementById("share-section")

const headerDisplay = document.querySelector(".header-display")
// Carousel Indicator Logic Only
const indicators = document.querySelectorAll('.carousel-indicator span')
let currentIndexForCarouselIndicator = 0
let currentIndexForCarouselStory = 0
let carouselTimer = null
let startDelayTimer = null
const DISPLAY_TIME = 20000 // ⏱️ 6 seconds
const headerDisplayBodyContainer = document.querySelector(".header-display-body")



const clickedStoryContainer = document.getElementById("clicked-story-container")
const readingPlaceContainer = document.getElementById("reading-place")

const signInOutPopup = document.getElementById("sign-in-sign-out-pop-up")

let snapshotTimeoutContinueStory = null
let snapshotTimeoutNewestStory = null
let snapshotTimeoutPopularStory = null
let snapshotTimeoutSearchSection = null
const continueStory = document.querySelector(".continue-story")
const continueStoryContainer = continueStory.querySelector(".horizontal-story")
const newestStory = document.querySelector('.newest-story')
const newestStoriesContainer = newestStory.querySelector('.horizontal-story')
const popularStory = document.querySelector(".popular-story")
const PopularStoriesContainer = popularStory.querySelector(".horizontal-story")
const readSectionBodyContainer = document.querySelector(".search-results")

const searchBody = document.querySelector(".search-body")
const searchInputH2 = searchBody.querySelector("h2")
const filterButtons = document.querySelectorAll('.filter-btn')
const searchInput = document.getElementById('searchInput')

let whatGenreToSearch = null

const lastGenre = localStorage.getItem("lastGenre") || "all" // Default to "all" if not found
const lastActiveButton = localStorage.getItem("lastActiveButton") || "all"  // Default to "all" if not found

const storyInput = document.getElementById('storyInput')
const shareBtn = document.getElementById('shareBtn')
const clearBtn = document.getElementById('clearBtn')
const charCount = document.getElementById('charCount')
const successMsg = document.getElementById('successMsg')

const sidebar = document.querySelector('.sidebar')
let maskTimeout; // store timeout ID 

const mainContentContainer = document.querySelector(".main-content")

window.addEventListener("DOMContentLoaded", setActiveNavFromHash)
window.addEventListener("DOMContentLoaded", router)
window.addEventListener("hashchange", setActiveNavFromHash)
window.addEventListener("hashchange", router)
window.addEventListener("load", router)

function getHashPath() {
    return location.hash
        .replace("#", "")
        .split("?")[0]
        .split("/")
}

function getHashQuery() {
    const hash = location.hash.replace("#", "")
    const queryString = hash.split("?")[1]

    if (!queryString) return {}

    return Object.fromEntries(
        new URLSearchParams(queryString)
    )
}

function router() {
    const path = getHashPath()
    const query = getHashQuery()

    if (path[0] === '') {
        showHomeSection()
    }

    if (path[0] === "home") {
        showHomeSection()
    }

    if (path[0] === "search") {
        showSearchSection()
    }

    if (path[0] === "share") {
        showShareSection()
    }

    if (path[0] === "story" && path[1] === "synopsis") {
        showSynopsis(query.story_id)
    }

    if (path[0] === "story" && path[1] === "reading") {
        showStory(query.story_id)
    }

    console.log(path)
}

navLinks.forEach(link => {
    link.addEventListener('click', function() {
        const span = link.querySelector('span')   
        const spanText = span.textContent.toLowerCase()

        if (spanText !== 'login' && spanText !== 'logout') {
            navLinks.forEach(l => l.classList.remove('active'))
            this.classList.add('active')
        }

        if (spanText !== 'login' && spanText !== 'logout') {
            if (spanText === 'home') {
                changeHashToHome()
            } else if (spanText === 'search') {
                changeHashToSearch()
            } else if (spanText === 'share') {
                changeHashToShare()
            }
            
            if (getComputedStyle(clickedStoryContainer).display === "flex") {
                if (spanText === 'search') {
                    changeHashToSearch()
                } else if (spanText === 'share') {
                    changeHashToShare()
                } else if (spanText === 'home') {
                    changeHashToHome()
                }
            }

        } else if (spanText === 'login' || spanText === 'logout')  {
            signInOrOut()
        }          
    })
})

function setActiveNavFromHash() {
    const currentHash = location.hash.replace('#', '') || 'home'

    navLinks.forEach(link => {
        const span = link.querySelector('span')   
        const spanText = span.textContent.toLowerCase()          

        if (spanText === currentHash && spanText !== 'login' && spanText !== 'logout') {
            link.classList.add("active")
        } else {
            link.classList.remove("active")
        }
    })
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        // I-remove ang 'active' class sa lahat ng buttons
        filterButtons.forEach(b => b.classList.remove('active'))

        // I-add ang 'active' class sa button na na-click
        this.classList.add('active')
        
        // Kunin ang genre mula sa 'data-genre' attribute ng button na na-click
        const genre = this.getAttribute('data-genre').toLocaleLowerCase()
        
        // I-save ang last selected genre at button sa localStorage
        localStorage.setItem("lastGenre", genre)
        localStorage.setItem("lastActiveButton", this.getAttribute('data-genre'))

        // I-fetch ang stories ng napiling genre
        fetchStoriesFromGenre(genre)
    })
})

if (lastGenre && lastActiveButton) {
    // I-set ang active na button gamit ang na-save na genre
    const activeBtn = document.querySelector(`[data-genre="${lastActiveButton}"]`)
    if (activeBtn) {
        activeBtn.classList.add('active')
    }
    
    // I-fetch ang stories para sa huling genre
    fetchStoriesFromGenre(lastGenre)
}

searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value

    if (searchTerm.trim() !== "") {
        searchInputH2.textContent = `"${searchTerm}"`
    } else {
        searchInputH2.textContent = "" 
    }
    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, searchTerm)
})

 // Update word count
storyInput.addEventListener('input', function() {
    // Split words — trim first to remove extra spaces
    const words = this.value.trim().split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length

    // Display word count
    charCount.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`

    // Enable/disable share button
    shareBtn.disabled = wordCount === 0
})

// Share button functionality
shareBtn.addEventListener('click', async function() {
    const user = auth.currentUser

    if (!user) {
        successMsg.innerHTML = `Please sign in first!`
        successMsg.classList.add('show')
        setTimeout(() => {
            successMsg.classList.remove('show')
        }, 2000)
        return
    }

    const userDocRef = doc(db, "users", user.uid) // rename variable
    const userDocSnap = await getDoc(userDocRef)  // rename variable
    if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
        // allow user page
        if (storyInput.value.trim()) {
            successMsg.innerHTML = `✓ Thank you! Your story has been successfully shared.`
            successMsg.classList.add('show')

            await saveUserAndInputToDB(storyInput.value, user)
            
            setTimeout(() => {
                storyInput.value = ''
                charCount.textContent = '0 word'
                shareBtn.disabled = true
                
                setTimeout(() => {
                    successMsg.classList.remove('show')
                }, 2000)
            }, 1000)
        }
    } else {
        successMsg.innerHTML = `Please sign in first!`
        successMsg.classList.add('show')
        setTimeout(() => {
            successMsg.classList.remove('show')
        }, 2000)
        return
    }
})

// Clear button functionality
clearBtn.addEventListener('click', function() {
    storyInput.value = ''
    charCount.textContent = '0 word'
    shareBtn.disabled = true
    successMsg.classList.remove('show')
})


// Function to handle the event listeners based on screen size
function manageSidebarEvents() {
    if (window.innerWidth >= 768) {
        // Attach event listeners when screen width is >= 768px
        sidebar.addEventListener('mouseenter', handleMouseEnter)
        sidebar.addEventListener('mouseleave', handleMouseLeave)
    } else {
        // Remove event listeners when screen width is < 768px
        sidebar.removeEventListener('mouseenter', handleMouseEnter)
        sidebar.removeEventListener('mouseleave', handleMouseLeave)

        // Reset the sidebar state
        sidebar.classList.remove('hovered')
        sidebar.classList.remove('mask-active')
        maskTimeout = null
    }
}

// Event handler for mouse enter (when hovering over sidebar)
function handleMouseEnter() {
    // Cancel any previous timeout
    if (maskTimeout) {
        clearTimeout(maskTimeout)
        maskTimeout = null
    }

    sidebar.classList.add('hovered')
    sidebar.classList.add('mask-active') // mask applies immediately on hover
}

// Event handler for mouse leave (when mouse leaves sidebar)
function handleMouseLeave() {
    sidebar.classList.remove('hovered')

    // Remove mask after 500 milliseconds
    maskTimeout = setTimeout(() => {
        sidebar.classList.remove('mask-active')
        maskTimeout = null // clear reference
    }, 500)
}

// Initial check when page loads
manageSidebarEvents()

// Add an event listener to detect when window size changes
window.addEventListener('resize', manageSidebarEvents)

async function presenceDetector(user) {
    const uid = user.uid;
    const userStatusRef = ref(DB, 'status/' + uid)
    const connectedRef = ref(DB, '.info/connected')

    // kapag nag connect sa internet
    onValue(connectedRef, (snap) => {
        if (snap.val() === false) return

        // kapag nawala ang connection o isinara ang tab
        onDisconnect(userStatusRef).set({
        state: 'offline',
        last_changed: fsServerTimestamp()
        })

        // mark online sa Realtime DB
        set(userStatusRef, {
        state: 'online',
        last_changed: fsServerTimestamp()
        })
    })
}

// call this function when user logs out
async function setOfflineOnLogout() {
    const user = auth.currentUser
    if (!user) return

        const userDocRef = doc(db, "users", user.uid) // rename variable
        const userDocSnap = await getDoc(userDocRef)  // rename variable
        if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
            // allow user page
            const uid = user.uid
            const userStatusRef = ref(DB, 'status/' + uid)
            await set(userStatusRef, {
                state: 'offline',
                last_changed: fsServerTimestamp()
            })
        } else {
            return
        }
}



onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid) // rename variable
        const userDocSnap = await getDoc(userDocRef)  // rename variable
        if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
            // allow user page
            theresLogInUser(user)
            presenceDetector(user) 
        } else {
            noLogInUser(user)
        }
    } else {
        noLogInUser(user)
    }
})

function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
    .then((result) => {
        const user = result.user
        saveUserIfNotExists(user)
        console.log("signed in successfully")
        closeSignInOutPopUp()
    })
    .catch((error) => {
        alert("Error")
    })
}

async function saveUserIfNotExists(user) {
    if (!user || !user.uid) {
        console.error("Invalid user object")
        return
    }

    try {
        // Reference sa Firestore document
        const userRef = doc(db, "users", user.uid)

        // Check kung existing na
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
            // Kung unang login pa lang, isave sa Firestore
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || "",
                role: "user",
                createdAt: serverTimestamp()
            })
            console.log("New user saved to Firestore ✅")
        } else {
            console.log("User already exists in Firestore, skipping save.")
        }
    } catch (error) {
        console.error("Error saving user to Firestore:", error)
    }
}


async function authSignOut() {
    await setOfflineOnLogout() 

    signOut(auth).then(() => {
        console.log("signed out successfully")
        closeSignInOutPopUp()
    }).catch((error) => {
        alert("Error")
    })
}

function signInOrOut() {
    signInOutPopup.style.display = "flex"
}

function changeHashToHome() {
    location.hash = 'home'
    loadHeaderCarousel()
}

function changeHashToSearch() {
    location.hash = `search`
}

function changeHashToShare() {
    location.hash = 'share'
}

function changeHashToSynopsis(storyId) {
    location.hash = `story/synopsis?story_id=${storyId}`
}

function changeHashToReading(docId) {
    location.hash = `story/reading?story_id=${docId}`
}

function showHomeSection() {
    displayNoneReading()
    displayNoneSynopsis()
    resetScrollTop()

    sections.forEach(section => {
        section.style.display = "none"
    })

    homeSection.style.display = "flex"
    sidebar.style.display = "block"
    mainContentContainer.classList.add("with-sidebar")
}

function showSearchSection() {
    displayNoneReading()
    displayNoneSynopsis()
    resetScrollTop()

    sections.forEach(section => {
        section.style.display = "none"
    })

    searchSection.style.display = "flex"
    sidebar.style.display = "block"
    mainContentContainer.classList.add("with-sidebar")
}

function showShareSection() {
    displayNoneReading()
    displayNoneSynopsis()
    resetScrollTop()

    sections.forEach(section => {
        section.style.display = "none"
    })

    shareSection.style.display = "flex"
    sidebar.style.display = "block"
    mainContentContainer.classList.add("with-sidebar")
}

async function showSynopsis(storyId) {
    clearPreviousDataOfReadingStory()
    displayNoneReading()
    await fetchClickedStories(storyId)
    resetScrollTop()

    sections.forEach(section => {
        section.style.display = "none"
    })

    clickedStoryContainer.style.display = "flex"
    sidebar.style.display = "block"
    mainContentContainer.classList.add("with-sidebar")
}

async function showStory(storyId) {
    displayNoneSynopsis()

    onAuthStateChanged(auth, async (user) => {
        let startPage = "page1"
        if (user) {
            const userDocRef = doc(db, "users", user.uid) // rename variable
            const userDocSnap = await getDoc(userDocRef)  // rename variable
            
            if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
                // allow user page
                startPage = await getUserSavedPage(user.uid, storyId)
            }
        }
        await fetchReadingStory(storyId, startPage)
    })

    resetScrollTop()

    sections.forEach(section => {
        section.style.display = "none"
    })

    readingPlaceContainer.style.display = "flex"
    sidebar.style.display = "none"
    mainContentContainer.classList.remove("with-sidebar")
}

async function getUserSavedPage(uid, storyId) {
    const userRef = doc(db, "users", uid)
    const snap = await getDoc(userRef)

    if (!snap.exists()) {
        console.warn("User doc missing (unexpected), defaulting to page1")
        return "page1"
    }

    const data = snap.data()

    // ✅ may readingStory field
    if (data.readingStory) {
        // may saved page for this story
        if (data.readingStory[storyId]) {
            return data.readingStory[storyId]
        }

        // may readingStory pero wala pang entry para sa story na to
        await setDoc(
            userRef,
            {
                readingStory: {
                    [storyId]: "page1"
                }
            },
            { merge: true }
        )

        return "page1"
    }

    // ❌ walang readingStory field at all → create it
    await setDoc(
        userRef,
        {
        readingStory: {
            [storyId]: "page1"
        }
        },
        { merge: true }
    )

    return "page1"
}

async function saveProgress(storyId, page) {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid) // rename variable
            const userDocSnap = await getDoc(userDocRef)  // rename variable
            
            if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
                // allow user page
                await setDoc(
                    userDocRef,
                    {
                        readingStory: {
                            [storyId]: page
                        }
                    },
                    { merge: true }
                )
            }
        }
        fetchReadingStory(storyId, page)
    })
}

async function resetStoryProgress(storyId) {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid) // rename variable
            const userDocSnap = await getDoc(userDocRef)  // rename variable
            
            if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
                // allow user page
                    await updateDoc(userDocRef, {
                        [`readingStory.${storyId}`]: "page1"
                    })
            }
        }
        fetchReadingStory(storyId, "page1")
    })
}

function changeIndicator() {
    indicators.forEach(ind => {
        ind.classList.remove('active')
        ind.style.animation = 'none'
        ind.offsetHeight
        ind.style.animation = ''
    })

    indicators[currentIndexForCarouselStory].classList.add('active')
}


function resetHeaderCarousel() {
    // 🔁 reset indicator animation (CRITICAL)
    const activeIndicator = document.querySelector(
        '.carousel-indicator span.active'
    )

    if (activeIndicator) {
        activeIndicator.classList.remove('active')

        // 💥 force CSS animation restart
        activeIndicator.style.animation = 'none'
        activeIndicator.offsetHeight // force reflow
        activeIndicator.style.animation = ''
    }
}

async function fetchHeaderCarouselStories() {
    const storiesRef = collection(db, "stories")

    const q = query(
        storiesRef,
        orderBy("uploadedAt", "desc"),
        limit(5)
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }))
}



async function loadHeaderCarousel() {
    resetHeaderCarousel()
    resetCarouselBackgroundImageUrl()
        // 🔁 reset JS timers
    if (startDelayTimer) {
        clearTimeout(startDelayTimer)
        startDelayTimer = null
    }

    if (carouselTimer) {
        clearInterval(carouselTimer)
        carouselTimer = null
    }

    currentIndexForCarouselStory = 0

    const stories = await fetchHeaderCarouselStories()
    if (stories.length === 0) return
    showSkeletonsInHomeSectionHeader(headerDisplayBodyContainer)
    startDelayTimer =  setTimeout(() => {
        clearSkeletonInHeader()
        // render first story
        renderHeaderSlide(stories[currentIndexForCarouselStory])
        changeIndicator()

        // ⏱️ TIMER – dito nagpapalit ang story
        carouselTimer = setInterval(() => {
            currentIndexForCarouselStory = (currentIndexForCarouselStory + 1) % stories.length
            renderHeaderSlide(stories[currentIndexForCarouselStory])
            changeIndicator()
        }, DISPLAY_TIME)
    }, 1000)
}

function renderHeaderSlide(story) {
    headerDisplay.style.backgroundImage = `
    /* Left strong white */
    linear-gradient(to right, hsla(0, 0%, 100%, 1) 0%, hsla(0, 0%, 100%, 0.575) 100%),
    /* Bottom strong white */
    linear-gradient(to top, hsla(0, 0%, 100%, 1) 0%, hsla(0, 0%, 100%, 0) 10%),
    /* Slight fade in center/top-right */
    radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, hsla(0, 0%, 100%, 0) 1%),
    /* Background image */
    url('${story.coverUrl}')
    `

    headerDisplayBodyContainer.innerHTML = `
        <h1>${toTitleCase(story.title)}</h1>

        <ul>
        <li>${toTitleCase(story.type) || "—"}</li>
        <li>${toTitleCase(story.language) || "—"}</li>
        <li>${story.uploadedAt.toDate().getFullYear() || "—"}</li>
        </ul>

        <p>${toTitleCase(story.synopsis)}</p>

        <ul>
        ${story.genre.map(genre => `<li>${toTitleCase(genre)}</li>`).join('')}
        </ul>

        <button data-id="${story.id}">
        Read Now
        </button>
    `

    const button = headerDisplayBodyContainer.querySelector(`button[data-id="${story.id}"]`)

    button.addEventListener("click", async function() {
        changeHashToReading(story.id)
    })
}

function resetCarouselBackgroundImageUrl() {
    headerDisplay.style.backgroundImage = `
    /* Left strong white */
    linear-gradient(to right, hsla(0, 0%, 100%, 1) 0%, hsla(0, 0%, 100%, 0.575) 100%),
    /* Bottom strong white */
    linear-gradient(to top, hsla(0, 0%, 100%, 1) 0%, hsla(0, 0%, 100%, 0) 10%),
    /* Slight fade in center/top-right */
    radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, hsla(0, 0%, 100%, 0) 1%),
    /* Background image */
    url('')
    `;
}


async function saveUserAndInputToDB(storyInputValue, user) {
    if (!user || !storyInputValue) return

    const userDocRef = doc(db, "users", user.uid)

    try {
        await setDoc(
            userDocRef,
            {
                sharedIdeas: arrayUnion({
                    idea: storyInputValue,
                    createdAt: new Date()
                })
            },
            { merge: true } // important para hindi mabura ibang fields
        )
        console.log("Idea saved with timestamp!")
    } catch (error) {
        console.error("Error saving idea:", error)
    }
}


function changeNavBarToSignIn() {
    signInOutPopup.innerHTML = `
        <div class="popup-card">
            <!-- Close button -->
            <button class="close-btn">
                <i class="fas fa-times"></i>
            </button>

            <!-- Icon -->
            <div class="popup-icon">
                <i class="fas fa-lock"></i>
            </div>

            <!-- Heading -->
            <h2 class="popup-heading">Sign in with vispath</h2>

            <!-- Description -->
            <p class="popup-description">
                Access your continuing story by signing in with your Google account
            </p>

            <!-- Google Sign-in Button -->
            <button class="google-signin-btn">
                <svg class="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </button>
        </div>
    `
    const signOutInBtn = signInOutPopup.querySelector(".google-signin-btn")

    signOutInBtn.addEventListener("click", function() {
        authSignInWithGoogle()
    })    

    const closeBtn = signInOutPopup.querySelector(".close-btn")

    closeBtn.addEventListener("click", function() {
        closeSignInOutPopUp()
    })

    navLinks.forEach(function(link) {
        const section = link.getAttribute('data-section')
        if (section === 'login') {
            link.innerHTML = `
                <i class="fa-regular fa-circle-user"></i>
                <span>Login</span>
            `
        }
    })
}

function changeNavBarToSignOut() {
    signInOutPopup.innerHTML = `
            <div class="popup-card">
            <!-- Close button -->
            <button class="close-btn">
                <i class="fas fa-times"></i>
            </button>

            <!-- Icon -->
            <div class="popup-icon">
                <i class="fas fa-lock"></i>
            </div>

            <!-- Heading -->
            <h2 class="popup-heading">Continue sign out</h2>

            <!-- Description -->
            <p class="popup-description">
                You are currently signed in. Continue your story or sign out when ready.
            </p>

            <!-- Google Sign-in Button -->
            <button class="google-signin-btn">
                Sign out
            </button>
        </div>
    `
    const signOutInBtn = signInOutPopup.querySelector(".google-signin-btn")

    signOutInBtn.addEventListener("click", function() {
        authSignOut()
    })

    const closeBtn = signInOutPopup.querySelector(".close-btn")

    closeBtn.addEventListener("click", function() {
        closeSignInOutPopUp()
    })

    navLinks.forEach(function(link) {
        const section = link.getAttribute('data-section')
        if (section === 'login') {
            link.innerHTML = `
                <i class="fa-regular fa-circle-user"></i>
                <span>Logout</span>
            `
        }
    })
}

function hadleClickedStory(event) {
    const el = event.currentTarget
    const storyId = el.getAttribute("story-id")

    console.log("Clicked story:", storyId)
    
    changeHashToSynopsis(storyId)
}

async function fetchClickedStories(storyId) {
    const docRef = doc(db, "stories", storyId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) { 
        console.log("Story data:", docSnap.data())
        renderClickedStory(docSnap)
    } else {
        console.log("Walang document na nahanap")
        return null
    }
}

function renderClickedStory(docSnap) {
    clearPreviousDataOfClickedStory()
    
    const story = docSnap.data()

    const storyEl = document.createElement("div")
    storyEl.classList.add("container")

    storyEl.innerHTML = `
        <button close-id="${docSnap.id}" class="close-btn-in-synopsis">
            <i class="fas fa-times"></i>
        </button>

        <div class="synopsis-header-wrapper">
            <img class="img-background" src="${story.coverUrl}">

            <div class="synopsis-top-header-container">
                <div class="img-container">
                    <img src="${story.coverUrl}">
                </div>

                <div class="synopsis-top-header-container-details">
                    <h1>${toTitleCase(story.title)}</h1>
                    <div>
                        <p><i class="fa-regular fa-eye"></i> Views: ${story.views}</p>
                        <p><i class="fa-light fa-book"></i> Type: ${toTitleCase(story.type)}</p>
                        <p><i class="fa-light fa-language"></i> Language: ${toTitleCase(story.language)}</p>
                        <p><i class="fa-light fa-calendar-days"></i> Uploaded: ${story.uploadedAt.toDate().getFullYear()}</p>
                    </div>
                    <button data-id= "${docSnap.id}"><i class="fa-regular fa-book-open"></i> Read Now</button>
                </div>
            </div>
        </div>

        <div class="synopsis-sub-header">
            <p class="sub-header-p">Genre</p>
            <ul>
                ${story.genre.map(genre => `<li>${toTitleCase(genre)}</li>`).join('')}
            </ul>
        </div>

        <div class="synopsis-sub-header">
            <p class="sub-header-p">Synopsis</p>
            <p>
                ${toTitleCase(story.synopsis)}
            </p>
        </div>
    `

    clickedStoryContainer.appendChild(storyEl)

    const closeBtn = storyEl.querySelector(`button[close-id="${docSnap.id}"]`)
    closeBtn.addEventListener("click", async function() {
        changeHashToHome()
    })

    const button = storyEl.querySelector(`button[data-id="${docSnap.id}"]`)

    button.addEventListener("click", async function() {
        changeHashToReading(docSnap.id)
    })
}

async function addStoryView(userUid, storyId) {
    if (!userUid) return

    const userRef = doc(db, "users", userUid)
    const storyRef = doc(db, "stories", storyId)

    const userSnap = await getDoc(userRef)

    // Check if user already viewed the story
    const viewedStories = userSnap.data()?.viewStory || []
    if (!viewedStories.includes(storyId)) {
        // Add storyId to user's viewStory array
        await updateDoc(userRef, {
            viewStory: arrayUnion(storyId)
        })

        // Increment views count in stories collection
        await updateDoc(storyRef, {
            views: increment(1)
        })
    }
}

async function fetchReadingStory(storyId, pageNo) {
    clearPreviousDataOfReadingStory()
    const docRefStoryInfo = doc(db, "stories", storyId)
    const docSnapStoryInfo = await getDoc(docRefStoryInfo)

    const docRef = collection(db, "stories", storyId, pageNo)
    const snapshot = await getDocs(docRef) 

    if (!snapshot.empty) {
        const docSnap = snapshot.docs[0]
        renderReadingStory(docSnap, docSnapStoryInfo)
    } else {
        console.log("No story document!")
        return null
    }
}

async function renderReadingStory(docSnap, docSnapStoryInfo) {

    const story = docSnap.data()
    const storyInfo = docSnapStoryInfo.data()

    const currentUser = auth.currentUser

    if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid) // rename variable
        const userDocSnap = await getDoc(userDocRef)  // rename variable
        if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
            // Add story view for current user
            await addStoryView(currentUser.uid, docSnapStoryInfo.id)
        } 
    }

    // Header Rendering //
    const hoverZoneEl = document.createElement("div")
    hoverZoneEl.id = "hover-zone"

    hoverZoneEl.innerHTML = ""

    readingPlaceContainer.appendChild(hoverZoneEl)

    const headerEl = document.createElement("header")
    headerEl.id = "info-header"
    headerEl.classList.add("info-header")

    headerEl.innerHTML = `
        <a href="index.html">
            <img class="info-logo" src="image/VP LOGO.png" alt="Go to homepage">
        </a>

        <a href="index.html#story/synopsis?story_id=${docSnapStoryInfo.id}">
            <p>
                ${toTitleCase(storyInfo.title)}
            </p>
        </a>

        <div class="nav-buttons">
            <a href="index.html#story/synopsis?story_id=${docSnapStoryInfo.id}">
                <i class="fa-regular fa-arrow-left" ></i>
            </a>
            <a id="reset-story-btn">
                <i class="fa-regular fa-arrow-rotate-left"></i>
            </a>
        </div>
    `

    readingPlaceContainer.appendChild(headerEl)
    const resetBtn = headerEl.querySelector("#reset-story-btn")

    resetBtn.addEventListener("click", async () => {
        const confirmReset = confirm(
            "Restart this story from the beginning?"
        )

        if (!confirmReset) return

        await resetStoryProgress(docSnapStoryInfo.id)
    })



    // Body Rendering //
    let existingStoryEl = readingPlaceContainer.querySelector(".reading-place-body")
    if (existingStoryEl) {
        existingStoryEl.remove()
    }


    const storyEl = document.createElement("div")
    storyEl.classList.add("reading-place-body")

    const mainBodyEl = document.createElement("div")
    mainBodyEl.classList.add("story-main-body")

    renderBody(story.body)

    function renderBody(bodyArray) {
        bodyArray.forEach(item => {
            if (item.type === "text") {
                const p = document.createElement("p")
                p.textContent = item.value
                mainBodyEl.appendChild(p)

            } else if (item.type === "image") {
                const img = document.createElement("img")
                img.src = item.value
                mainBodyEl.appendChild(img)
            }
        })
    }

    storyEl.appendChild(mainBodyEl)


    // Options Rendering //
    const optionsEl = document.createElement("div")
    optionsEl.classList.add("options-button")

    renderOptions(story.options)

    function renderOptions(optionsArray) {
        optionsArray.forEach(option => {
            const btn = document.createElement("button")
            btn.textContent = option.label
            btn.onclick = () => saveProgress(docSnapStoryInfo.id, `page${option.nextPage}`)
            optionsEl.appendChild(btn)
        })
    }

    storyEl.appendChild(optionsEl)

    readingPlaceContainer.appendChild(storyEl)

    addHeaderHoverListener(headerEl, hoverZoneEl)
}

function addHeaderHoverListener(infoHeader, hoverZone) {
        // State tracking variable
        let isHeaderHidden = false

            /**
         * Hides the header with smooth animation
         * Adds 'hidden' class which triggers CSS transitions
         */
        function hideHeader() {
            if (!isHeaderHidden) {
                infoHeader.classList.add('hidden')
                isHeaderHidden = true
            }
        }

        /**
         * Shows the header with smooth animation
         * Removes 'hidden' class which triggers CSS transitions
         */
        function showHeader() {
            if (isHeaderHidden) {
                infoHeader.classList.remove('hidden')
                isHeaderHidden = false
            }
        }

        /**
         * Scroll Event Listener
         * Hides header whenever user scrolls in any direction
         * This creates an immersive reading experience
         */
        window.addEventListener('scroll', function() {
            hideHeader()
        })

        /**
         * Hover / Touch Zone Event Listener
         * Shows header when pointer enters top area (mouse or touch)
         */
        hoverZone.addEventListener('pointerenter', function () {
            showHeader()
        })

        /**
         * Header Pointer Event Listener
         * Keeps header visible while user interacts with it
         */
        infoHeader.addEventListener('pointerenter', function () {
            showHeader()
        })
}

function homeSectionRenderContinueStoriesFromDB(doc) {
    const skeletons = continueStoryContainer.querySelectorAll(".skeleton-container")
    skeletons.forEach(s => s.remove())

    const story = doc.data()

    const storyEl = document.createElement("div")
    storyEl.classList.add("story-animate")
    storyEl.setAttribute("story-id", doc.id)

    storyEl.innerHTML = `
        <img src="${story.coverUrl}">
        <h3>${toTitleCase(story.title)}</h3>
        <div class="year-type-container">
            <p><i class="fa-light fa-calendar-days"></i> ${story.uploadedAt.toDate().getFullYear()}</p>
            <p><i class="fa-light fa-book"></i> ${toTitleCase(story.type)}</p>
        </div>
    `
    continueStoryContainer.appendChild(storyEl)

    storyEl.addEventListener("dblclick", hadleClickedStory)
}

function homeSectionRenderNewestStoriesFromDB(doc) {

    const skeletons = newestStoriesContainer.querySelectorAll(".skeleton-container")
    skeletons.forEach(s => s.remove())

    const story = doc.data()

    const storyEl = document.createElement("div")
    storyEl.classList.add("story-animate")
    storyEl.setAttribute("story-id", doc.id)

    storyEl.innerHTML = `
        <img src="${story.coverUrl}">
        <h3>${toTitleCase(story.title)}</h3>
        <div class="year-type-container">
            <p><i class="fa-light fa-calendar-days"></i> ${story.uploadedAt.toDate().getFullYear()}</p>
            <p><i class="fa-light fa-book"></i> ${toTitleCase(story.type)}</p>
        </div>
    `
    newestStoriesContainer.appendChild(storyEl)

    storyEl.addEventListener("dblclick", hadleClickedStory)
}

function homeSectionRenderPopularStoriesFromDB(doc) {
    const skeletons = PopularStoriesContainer.querySelectorAll(".skeleton-container")
    skeletons.forEach(s => s.remove())

    const story = doc.data()

    const storyEl = document.createElement("div")
    storyEl.classList.add("story-animate")
    storyEl.setAttribute("story-id", doc.id)

    storyEl.innerHTML = `
        <img src="${story.coverUrl}">
        <h3>${toTitleCase(story.title)}</h3>
        <div class="year-type-container">
            <p><i class="fa-light fa-calendar-days"></i> ${story.uploadedAt.toDate().getFullYear()}</p>
            <p><i class="fa-light fa-book"></i> ${toTitleCase(story.type)}</p>
        </div>
    `
    PopularStoriesContainer.appendChild(storyEl)

    storyEl.addEventListener("dblclick", hadleClickedStory)

}

function readSectionRenderStoriesFromDB(doc) {
    clearSkeletonInReadSection()

    const story = doc.data()

    const storyEl = document.createElement("div")
    storyEl.classList.add("story-animate")
    storyEl.setAttribute("story-id", doc.id)

    storyEl.innerHTML = `
    <img src="${story.coverUrl}">
    <h3>${toTitleCase(story.title)}</h3>
    <div class="year-type-container">
        <p><i class="fa-light fa-calendar-days"></i> ${story.uploadedAt.toDate().getFullYear()}</p>
        <p><i class="fa-light fa-book"></i> ${toTitleCase(story.type)}</p>
    </div>
    `
    readSectionBodyContainer.appendChild(storyEl)

    storyEl.addEventListener("dblclick", hadleClickedStory)
}

function homeSectionFetchContinueStoriesInRealTimeFromDb(q) {
    if (snapshotTimeoutContinueStory) {
        clearTimeout(snapshotTimeoutContinueStory)
    }
    
    onSnapshot(q, (snapshot) => {
        // Always clear bago mag-render ulit
        clearHomeSectionContinueStories()

        // Show skeletons habang naglo-load
        showSkeletonsInHomeSection(continueStoryContainer, snapshot.size)

        snapshotTimeoutContinueStory = setTimeout(() => {
            clearHomeSectionContinueStories()

            if (snapshot.empty) {
                continueStoryContainer.innerHTML = `
                    <div class="no-story">
                        <p>Ooops!</p>
                        <p>Looks like theres nothing here.</p>
                    </div>
                `
                return
            } else {
                snapshot.forEach((doc) => {
                    homeSectionRenderContinueStoriesFromDB(doc)
                })
            }
        }, 1000)
    })
}

function homeSectionFetchNewestStoriesInRealTimeFromDb(q) {
    if (snapshotTimeoutNewestStory) {
        clearTimeout(snapshotTimeoutNewestStory)
    }
    
    onSnapshot(q, (snapshot) => {
        // Always clear bago mag-render ulit
        clearHomeSectionNewestStories()

        // Show skeletons habang naglo-load
        showSkeletonsInHomeSection(newestStoriesContainer, snapshot.size)

        snapshotTimeoutNewestStory = setTimeout(() => {
            clearHomeSectionNewestStories()

            if (snapshot.empty) {
                newestStoriesContainer.innerHTML = `
                    <div class="no-story">
                        <p>Ooops!</p>
                        <p>Looks like theres nothing here.</p>
                    </div>
                `
                return
            } else {
                snapshot.forEach((doc) => {
                    homeSectionRenderNewestStoriesFromDB(doc)
                })
            }
        }, 1000)
    })
}

function homeSectionFetchPopularStoriesInRealTimeFromDb(q) {
    if (snapshotTimeoutPopularStory) {
        clearTimeout(snapshotTimeoutPopularStory)
    }

    onSnapshot(q, (snapshot) => {
        clearHomeSectionPopularStories()
        showSkeletonsInHomeSection(PopularStoriesContainer, snapshot.size)

        snapshotTimeoutPopularStory = setTimeout(() => {
            clearHomeSectionPopularStories()

            if (snapshot.empty) {
                PopularStoriesContainer.innerHTML = `
                    <div class="no-story">
                        <p>Ooops!</p>
                        <p>Looks like theres nothing here.</p>
                    </div>
                `
                return
            }

            snapshot.forEach((doc) => {
                homeSectionRenderPopularStoriesFromDB(doc)
            })
        }, 1000)
    })
}

function searchSectionFetchInRealTimeStoriesFromDB(q, searchTerm) {
    if (snapshotTimeoutSearchSection) {
        clearTimeout(snapshotTimeoutSearchSection)
    }

    onSnapshot(q, (snapshot) => {
        clearReadSectionBodyContainer()
        readSectionBodyContainer.classList.remove("no-results")
        showSkeletonsInReadSection(readSectionBodyContainer, snapshot.size)

        
        snapshotTimeoutSearchSection = setTimeout(() => {
            clearReadSectionBodyContainer()

            if (snapshot.empty) {
                readSectionBodyContainer.classList.add("no-results")
                readSectionBodyContainer.innerHTML = `
                    <div class="no-story">
                        <p>Ooops!</p>
                        <p>Looks like theres nothing here.</p>
                    </div>
                `
                return
            }

             // Basic client-side filtering
            const filteredDocs = snapshot.docs.filter(doc => {
                const docData = doc.data()       // Get the document data
                const docTitle = docData.title || ''  // Use the 'title' field
                return docTitle.toLowerCase().includes(searchTerm.toLowerCase())
            })

            if (filteredDocs.length === 0) {
                readSectionBodyContainer.classList.add("no-results")
                readSectionBodyContainer.innerHTML = `
                    <div class="no-story">
                        <p>Ooops!</p>
                        <p>Looks like theres nothing here.</p>
                    </div>
                `
            } else {
                // Show the filtered stories
                filteredDocs.forEach(doc => {
                    readSectionBodyContainer.classList.remove("no-results")
                    readSectionRenderStoriesFromDB(doc)
                })
            }
        }, 2000)
    })
}


async function fetchContinueStories() {
    let storyIds = await getUserContinueStoryIds()
    if (storyIds.length === 0) {
        storyIds = ["noStory"]
    } 

    const storiesRef = collection(db, "stories")

    const q = query(
        storiesRef,
        where("__name__", "in", storyIds),
        orderBy("uploadedAt", "desc")
    )

    homeSectionFetchContinueStoriesInRealTimeFromDb(q)
}

async function getUserContinueStoryIds() {
    const user = auth.currentUser
    if (!user) return []

    const userDocRef = doc(db, "users", user.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) return []
    if (userDocSnap.data().role !== "user") return []

    const data = userDocSnap.data()
    if (!data.readingStory) return []

    return Object.keys(data.readingStory)
}



function fetchNewestStories() {
    const storiesRef = collection(db, "stories") 

    const now = new Date()
    now.setHours(23, 59, 59, 999) 

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 8)
    cutoff.setHours(0, 0, 0, 0)

    const startTimestamp = Timestamp.fromDate(cutoff)
    const endTimestamp = Timestamp.fromDate(now)

    const q = query(
        storiesRef,
        where("uploadedAt", ">=", startTimestamp),
        where("uploadedAt", "<=", endTimestamp),
        orderBy("uploadedAt", "desc")
    )

    homeSectionFetchNewestStoriesInRealTimeFromDb(q)
}

function fetchPopularStories() {
    const storiesRef = collection(db, "stories") 
    const q = query(
    storiesRef,
    orderBy("views", "desc"),
    limit(5)
    )

    homeSectionFetchPopularStoriesInRealTimeFromDb(q)
}

function fetchAllStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}


function fetchRomanceStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Romance"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchActionStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Action"),
        orderBy("uploadedAt", "desc")
    )

    
    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchHorrorStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Horror"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchComedyStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Comedy"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchDramaStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Drama"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchAdventureStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Adventure"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchMysteryStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Mystery"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchSciFiStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Sci-Fi"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function fetchSliceOfLifeStories() {
    whatGenreToSearch = null
    const storiesRef = collection(db, "stories") 

    whatGenreToSearch = query(
        storiesRef,
        where("genre", "array-contains", "Slice of life"),
        orderBy("uploadedAt", "desc")
    )

    searchSectionFetchInRealTimeStoriesFromDB(whatGenreToSearch, '')
}

function clearHomeSectionContinueStories() {
    continueStoryContainer.innerHTML = ""
}

function clearHomeSectionNewestStories() {
    newestStoriesContainer.innerHTML = ""
}

function clearHomeSectionPopularStories() {
    PopularStoriesContainer.innerHTML = "" 
}

function clearReadSectionBodyContainer() {
    readSectionBodyContainer.innerHTML = ""
}

function showContinueStoryContainer() {
    continueStory.style.display = "block"
}

function hideContinueStoryContainer() {
    continueStory.style.display = "none"
}

function showSkeletonsInHomeSectionHeader(container) {
    container.innerHTML = "" 
    container.classList.add("skeleton-container", "story-animate")
        
    container.innerHTML = `
        <div class="skeleton skeleton-title"></div>

        <ul class="skeleton-list">
            <li class="skeleton"></li>
            <li class="skeleton"></li>
            <li class="skeleton"></li>
        </ul>

        <div class="skeleton-paragraph">
            <span class="skeleton"></span>
            <span class="skeleton"></span>
            <span class="skeleton"></span>
            <span class="skeleton"></span>
        </div>

        <ul class="skeleton-list">
            <li class="skeleton"></li>
            <li class="skeleton"></li>
            <li class="skeleton"></li>
        </ul>

        <div class="skeleton skeleton-button"></div>
    `
}

function showSkeletonsInHomeSection(container, count = 0) {
    container.innerHTML = "" 
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div")
        skeleton.classList.add("skeleton-container", "story-animate")
        skeleton.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
        `
        container.appendChild(skeleton)
    }
}

function showSkeletonsInReadSection(container, count = 0) {
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div")
        skeleton.classList.add("skeleton-container", "story-animate")
        skeleton.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
        `
        container.appendChild(skeleton)
    }
}

function clearSkeletonInHeader() {
    headerDisplayBodyContainer.innerHTML = "" 
    headerDisplayBodyContainer.classList.remove("skeleton-container")
}

function clearSkeletonInReadSection() {
    const skeletons = readSectionBodyContainer.querySelectorAll(".skeleton-container")
    skeletons.forEach(s => s.remove())
}

function fetchStoriesFromHome() {
    loadHeaderCarousel()
    fetchNewestStories()
    fetchPopularStories()
}

function fetchStoriesFromGenre(selectedGenre) {
    if (selectedGenre === "all") {
        fetchAllStories()
    } else if (selectedGenre === "romance") {
        fetchRomanceStories()
    } else if (selectedGenre === "action") {
        fetchActionStories()
    } else if (selectedGenre === "horror") {
        fetchHorrorStories()
    } else if (selectedGenre === "comedy") {
        fetchComedyStories()
    } else if (selectedGenre === "drama") {
        fetchDramaStories()
    } else if (selectedGenre === "adventure") {
        fetchAdventureStories()
    } else if (selectedGenre === "mystery") {
        fetchMysteryStories()
    } else if (selectedGenre === "sci-fi") {
        fetchSciFiStories()
    } else if (selectedGenre === "slice of life") {
        fetchSliceOfLifeStories()
    }
}

function toTitleCase(str) {
    return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function closeSignInOutPopUp() {
    signInOutPopup.style.display = "none"
}

function clearPreviousDataOfClickedStory() {
    clickedStoryContainer.innerHTML = ""
}

function displayNoneSynopsis() {
    clickedStoryContainer.style.display = "none"
}

function clearPreviousDataOfReadingStory() {
    readingPlaceContainer.innerHTML = ""
}

function displayNoneReading() {
    readingPlaceContainer.style.display = "none"
}

function resetScrollTop() {
    const currentSection = document.querySelector(".main-content")
    currentSection.scrollIntoView({ behavior: 'instant', block: 'start' })
}

function theresLogInUser(user) {
    resetScrollTop()
    console.log(user.email)
    changeNavBarToSignOut()
    showContinueStoryContainer()
    fetchStoriesFromHome()
    fetchContinueStories()
}

function noLogInUser(user) {
    resetScrollTop()
    console.log("no log in user")
    changeNavBarToSignIn()
    hideContinueStoryContainer()
    fetchStoriesFromHome()
}

