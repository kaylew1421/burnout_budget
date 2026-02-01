import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDzbP0r6d2WPAAH1YbuNaFu4l1r3lbBnI4",
  authDomain: "burnout-budget.firebaseapp.com",
  projectId: "burnout-budget",
  storageBucket: "burnout-budget.firebasestorage.app",
  messagingSenderId: "549142670971",
  appId: "1:549142670971:web:ecb378f343b42c546a7cde",
  measurementId: "G-QLZ953CFYW"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);