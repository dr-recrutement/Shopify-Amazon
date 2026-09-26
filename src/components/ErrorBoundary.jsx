import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// A rendering crash anywhere inside the theme (a bad section prop, a
// stray undefined reference like the primaryText bug just found) used to
// take down the entire page with a blank screen and a console-only error
// - nothing a real visitor or merchant would ever see explained. This
// catches it and shows something recoverable instead, without needing to
// predict every possible future bug.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught a render crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
          <p className="text-sm font-semibold text-[#202223]">Un problème d'affichage est survenu.</p>
          <p className="text-xs text-[#6D7175] mt-1">Rechargez la page. Si le problème persiste, contactez le support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
