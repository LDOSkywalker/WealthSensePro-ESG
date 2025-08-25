import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DisclaimerModal from './DisclaimerModal';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [otherReferralSource, setOtherReferralSource] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralSource: string;
    otherReferralSource?: string;
  } | null>(null);
  
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setReferralSource('');
    setOtherReferralSource('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        return setError('Veuillez remplir tous les champs');
      }
      
      if (password !== confirmPassword) {
        return setError('Les mots de passe ne correspondent pas');
      }
      
      const isPasswordValid = Object.values(passwordValidation).every(value => value);
      if (!isPasswordValid) {
        return setError('Votre mot de passe ne respecte pas les critères de sécurité');
      }

      if (referralSource === 'other' && !otherReferralSource.trim()) {
        return setError('Veuillez préciser comment vous avez connu WealthSensePro');
      }

      // Store form data temporarily in localStorage
      localStorage.setItem('tempFirstName', firstName);
      localStorage.setItem('tempLastName', lastName);
      localStorage.setItem('tempEmail', email);
      localStorage.setItem('tempReferralSource', referralSource);
      if (referralSource === 'other') {
        localStorage.setItem('tempOtherReferralSource', otherReferralSource);
      }

      setFormData({
        email,
        password,
        firstName,
        lastName,
        referralSource,
        otherReferralSource: referralSource === 'other' ? otherReferralSource : undefined,
      });
      setShowDisclaimer(true);
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue';
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Format d'email invalide";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Erreur de connexion au réseau. Veuillez vérifier votre connexion internet.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisclaimerAccept = async () => {
    if (!formData) return;

    try {
      setLoading(true);
      
              const userData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            referralSource: formData.referralSource === 'other' ? 'other' : formData.referralSource,
            otherReferralSource: formData.otherReferralSource,
            disclaimerAccepted: true,
            disclaimerAcceptedAt: Date.now()
        };
        
        const signupResult = await authService.signup({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            referralSource: formData.referralSource,
            otherReferralSource: formData.otherReferralSource,
            disclaimerAccepted: true,
            disclaimerAcceptedAt: Date.now()
        });
        
        await login(formData.email, formData.password);
        navigate('/');
      
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Format d'email invalide";
      } else if (err.message && err.message.includes('JSON.parse')) {
        errorMessage = 'Erreur de communication avec le serveur';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setShowDisclaimer(false);
      setFormData(null);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>
          
          {!isLogin && (
            <p className="text-center text-gray-600 mb-6">
              Créez votre compte pour accéder à WealthSenseImpact
            </p>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="firstName">
                    Prénom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Luc"
                      required={!isLogin}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="lastName">
                    Nom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Skywalker"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="luc.skywalker@gmail.com"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Affichage des critères pour la connexion ET l'inscription */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-sm ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">✓</span> Au moins 8 caractères
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">✓</span> Au moins une majuscule
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">✓</span> Au moins une minuscule
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.number ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">✓</span> Au moins un chiffre
                  </div>
                  <div className={`flex items-center text-sm ${passwordValidation.special ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">✓</span> Au moins un caractère spécial
                  </div>
                </div>
              )}
            </div>
            
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="referralSource">
                    Comment avez-vous connu WealthSenseImpact ?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Info className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="referralSource"
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                    >
                      <option value="">Sélectionnez une option</option>
                      <option value="Meyon">Je suis client de Meyon</option>
                      <option value="social">Réseaux sociaux</option>
                      <option value="friend">Recommandation d'un ami</option>
                      <option value="search">Moteur de recherche</option>
                      <option value="ad">Publicité</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  {referralSource === 'other' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="otherReferralSource">
                        Précisez
                      </label>
                      <input
                        id="otherReferralSource"
                        type="text"
                        value={otherReferralSource}
                        onChange={(e) => setOtherReferralSource(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-900 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Précisez comment vous nous avez connu"
                        required
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={toggleForm}
              className="text-primary hover:underline focus:outline-none"
            >
              {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
            </button>
            {/* Lien Mot de passe oublié sous le bouton Créer un compte */}
            {isLogin && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-primary hover:underline text-sm focus:outline-none"
                  onClick={() => navigate('/reset-password')}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        darkMode={false}
      />
    </>
  );
};

export default AuthForm;