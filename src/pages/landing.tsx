import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  ChevronRight, 
  MessageSquare,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Target,
  BarChart2,
  Brain
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { authService } from '../services/auth';
import Logo from '../components/Logo';
import { useInView as useInViewIntersection } from 'react-intersection-observer';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Définition des fonctionnalités
const features = [
  {
    icon: MessageSquare,
    title: "Expérience IA en langage naturel",
    description: "Posez vos questions comme à un conseiller. Notre IA comprend vos besoins et vous guide avec des réponses claires et personnalisées.",
    benefits: [
      "Moteur IA avancé pour des réponses naturelles",
      "Suggestions proactives personnalisées",
      "Aide contextuelle intelligente"
    ]
  },
  {
    icon: Target,
    title: "Accès Intelligent à l'Information Financière",
    description: "Toutes les données dont vous avez besoin, validées et présentées clairement.",
    benefits: [
      "Valorisation en temps réel",
      "Informations détaillées sur tous les produits",
      "Visualisation intuitive des données"
    ]
  },
  {
    icon: BarChart2,
    title: "Outils de Visualisation et d'Aide à la Décision",
    description: "Comparez, visualisez, décidez. Des outils puissants pour des choix éclairés.",
    benefits: [
      "Comparaison graphique interactive",
      "Indicateurs clés personnalisés",
      "Synthèses visuelles détaillées"
    ]
  },
  {
    icon: Brain,
    title: "Contenus Éducatifs Gamifiés",
    description: "Apprenez en jouant. Comprenez avant d'investir.",
    benefits: [
      "Modules vidéo interactifs",
      "Quiz dynamiques avec feedback",
      "Parcours personnalisés"
    ]
  }
];

// Composant Features
const Features = () => {
  const { ref: featuresRef, inView: featuresInView } = useInViewIntersection({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <section
      ref={featuresRef}
      className="relative py-24 bg-dark-lighter"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Découvrez la Puissance de WealthSense
            </h2>
            <p className="text-xl text-gray-400">
              Votre copilote intelligent pour comprendre, comparer et investir en toute confiance
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-dark-card rounded-2xl p-8 border border-gray-800 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center text-primary group-hover:text-primary-light transition-colors">
                  <span className="text-sm font-medium">En savoir plus</span>
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  // Chat Demo
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const conversation = [
    {
      question: "Bonjour, comment puis-je vous aider aujourd'hui ?",
      response: "Je souhaite me renseigner sur le Private Equity"
    },
    {
      question: "Je vais vous expliquer les fondamentaux du Private Equity. Que souhaitez-vous savoir en particulier ?",
      response: "Quels sont les avantages et les risques ?"
    },
    {
      question: "Le Private Equity offre plusieurs avantages comme un potentiel de rendement élevé et une diversification du portefeuille, mais comporte aussi des risques comme l'illiquidité et une volatilité importante. Voulez-vous que je détaille ces points ?",
      response: "Oui, je voudrais en savoir plus sur les rendements"
    }
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      if (showResponse) {
        if (currentMessageIndex < conversation.length - 1) {
          setCurrentMessageIndex(prev => prev + 1);
        } else {
          setCurrentMessageIndex(0);
        }
        setShowResponse(false);
      } else {
        setShowResponse(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentMessageIndex, showResponse]);

  useEffect(() => {
    setShowContent(true);
  }, []);

  // Validation du mot de passe
  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const allPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPasswordValid) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.');
      return;
    }
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    try {
      setError('');
      setLoading(true);
      await authService.signup({
        email,
        password,
        firstName,
        lastName,
        referralSource: 'landing',
        disclaimerAccepted: true,
        disclaimerAcceptedAt: Date.now(),
      });
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Format d'email invalide";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white overflow-hidden">
      {/* Header */}
      <header className="fixed w-full z-50 bg-dark/80 backdrop-blur-lg border-b border-gray-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Logo className="text-2xl" />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
              >
                Connexion
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <main className="relative">
        {/* Hero Section avec formulaire d'inscription */}
        <section 
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-mesh-pattern"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-dark to-dark opacity-80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Hero Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-8">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Propulsé par l'IA
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary-light to-primary bg-clip-text text-transparent">
                  Votre Assistant Personnel en Gestion de Patrimoine
                </h1>
                <p className="text-xl text-gray-400 max-w-3xl mb-12">
                  Découvrez une nouvelle façon d'aborder vos investissements avec notre assistant IA spécialisé
                </p>
                {/* Floating Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl"
                  />
                </div>
              </motion.div>
              {/* Registration Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-dark-card rounded-2xl border border-gray-800 shadow-2xl p-8 backdrop-blur-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative">
                    <h2 className="text-2xl font-bold text-center mb-2">
                      Créer un compte
                    </h2>
                    <p className="text-center text-gray-400 mb-6">
                      Créez votre compte pour accéder à WealthSense
                    </p>
                    {error && (
                      <div className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="firstName">
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
                              className="bg-dark border border-gray-700 text-white rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                              placeholder="Luc"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="lastName">
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
                              className="bg-dark border border-gray-700 text-white rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                              placeholder="Skywalker"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="email">
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
                            className="bg-dark border border-gray-700 text-white rounded-lg pl-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                            placeholder="luc.skywalker@gmail.com"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="password">
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
                            className="bg-dark border border-gray-700 text-white rounded-lg pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
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
                        {/* Affichage dynamique des critères */}
                        <ul className="mt-2 text-sm space-y-1">
                          <li className={passwordValidation.length ? 'text-green-400' : 'text-gray-400'}>
                            ✓ Au moins 8 caractères
                          </li>
                          <li className={passwordValidation.uppercase ? 'text-green-400' : 'text-gray-400'}>
                            ✓ Au moins une majuscule
                          </li>
                          <li className={passwordValidation.lowercase ? 'text-green-400' : 'text-gray-400'}>
                            ✓ Au moins une minuscule
                          </li>
                          <li className={passwordValidation.number ? 'text-green-400' : 'text-gray-400'}>
                            ✓ Au moins un chiffre
                          </li>
                          <li className={passwordValidation.special ? 'text-green-400' : 'text-gray-400'}>
                            ✓ Au moins un caractère spécial
                          </li>
                        </ul>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
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
                            className="bg-dark border border-gray-700 text-white rounded-lg pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                            placeholder="••••••••"
                            required
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
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Création en cours...' : 'Créer mon compte'}
                        <ChevronRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                      <p className="text-center text-sm text-gray-400 mt-6">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-primary hover:text-primary-light transition-colors">
                          Se connecter
                        </Link>
                      </p>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Chat Demo Section */}
        <section className="py-16 bg-dark relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-dark to-dark opacity-80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-8">
                <MessageSquare className="w-4 h-4 mr-2" />
                Assistant IA
              </span>
              <h2 className="text-4xl font-bold mb-6">
                Une Expertise Financière à Portée de Main
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Obtenez des réponses instantanées à toutes vos questions sur la gestion de patrimoine
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-dark-card rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 space-y-6">
                  {conversation.slice(0, currentMessageIndex + 1).map((msg, index) => (
                    <React.Fragment key={index}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-start"
                      >
                        <div className="bg-primary/10 text-primary p-3 rounded-lg flex-shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="ml-4 bg-gray-800 p-4 rounded-lg flex-grow">
                          <p className="text-white">{msg.question}</p>
                        </div>
                      </motion.div>
                      {(index < currentMessageIndex || showResponse) && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-start justify-end"
                        >
                          <div className="mr-4 bg-primary p-4 rounded-lg max-w-2xl">
                            <p className="text-white">{msg.response}</p>
                          </div>
                          <div className="bg-primary/10 text-primary p-3 rounded-lg flex-shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                        </motion.div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-lighter">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à optimiser votre patrimoine ?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Rejoignez WealthSense aujourd'hui et bénéficiez d'un accompagnement personnalisé pour vos investissements
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors group"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-dark-card border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Logo className="text-2xl mb-4" />
              <p className="text-gray-400 text-sm">
                Votre assistant personnel en gestion de patrimoine, propulsé par l'intelligence artificielle
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Produits</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Tarification
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Mentions légales
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400 text-sm">
              © {new Date().getFullYear()} WealthSense. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;