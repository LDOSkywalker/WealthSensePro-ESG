import React from 'react';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  darkMode?: boolean;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ 
  isOpen, 
  onAccept,
  darkMode = true 
}) => {
  if (!isOpen) return null;

  const handleAccept = async () => {
    try {
      // Send registration data to n8n webhook
      await axios.post(import.meta.env.VITE_REGISTRATION_WEBHOOK_URL, {
        event: 'disclaimer_accepted',
        timestamp: Date.now(),
        userData: {
          firstName: localStorage.getItem('tempFirstName'),
          lastName: localStorage.getItem('tempLastName'),
          email: localStorage.getItem('tempEmail'),
          professionalActivity: localStorage.getItem('tempProfessionalActivity'),
          referralSource: localStorage.getItem('tempReferralSource'),
          otherReferralSource: localStorage.getItem('tempOtherReferralSource'),
          disclaimerAcceptedAt: Date.now()
        }
      });

      // Clear temporary storage
      localStorage.removeItem('tempFirstName');
      localStorage.removeItem('tempLastName');
      localStorage.removeItem('tempEmail');
      localStorage.removeItem('tempProfessionalActivity');
      localStorage.removeItem('tempReferralSource');
      localStorage.removeItem('tempOtherReferralSource');

      // Complete registration
      onAccept();
    } catch (error) {
      console.error('Error sending registration data to webhook:', error);
      // Continue with registration even if webhook fails
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className={`relative w-full max-w-2xl mx-4 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Bienvenue sur WealthSense
            </h3>
          </div>
        </div>

        <div className={`space-y-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>
            Bienvenue sur l'assistant IA dédié à la finance responsable proposé par Meyon.
          </p>

          <p>
            Cet outil est actuellement en période de test et d'apprentissage. Les informations, 
            recommandations et simulations qu'il propose sont générées par un modèle 
            d'intelligence artificielle en cours de perfectionnement. Bien que nous déployions tous 
            les efforts nécessaires pour améliorer leurs pertinences et leur exactitudes, elles ne 
            doivent pas être considérées comme des conseils définitifs ou personnalisés.
          </p>

          <p>
            Pour garantir la protection de vos données, nous vous invitons à ne pas saisir 
            d'informations personnelles, sensibles et/ou confidentielles dans cet outil.
          </p>

          <p>
            Nous vous rappelons également que les performances passées ne préjugent en aucun 
            cas des performances futures. Toute décision d'investissement doit être prise avec 
            prudence et idéalement accompagnée des conseils d'un professionnel qualifié.
          </p>

          <p>
            Pour toute question ou besoin d'accompagnement personnalisé, n'hésitez pas à 
            contacter directement un conseiller.
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAccept}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            J'accepte
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;