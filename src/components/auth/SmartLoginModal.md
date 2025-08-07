# SmartLoginModal Component

A sophisticated login modal component built with Radix UI Dialog that provides an accessible and user-friendly authentication experience.

## Features

- ✅ **Radix UI Dialog** - Fully accessible modal with proper focus management
- ✅ **Visual Layout & Animations** - Smooth enter/exit animations with urgency-based styling
- ✅ **State Management** - Complete open/close state handling
- ✅ **Keyboard Navigation** - ESC key support and proper focus management
- ✅ **Social Login Integration** - GitHub and Google OAuth support
- ✅ **Contextual Messaging** - Different UI based on trigger type
- ✅ **Mobile Responsive** - Adapts to different screen sizes
- ✅ **Error Handling** - User-friendly error messages

## Usage

```tsx
import { SmartLoginModal, LoginTrigger } from '@/components/auth/SmartLoginModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const trigger: LoginTrigger = {
    type: 'trial_exhausted',
    message: 'You\'ve used all 5 free analysis requests. Sign in to continue.',
    urgency: 'high',
    allowSkip: false
  };

  const handleSuccess = (result: any) => {
    console.log('Login successful:', result);
    // Handle successful login
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Open Login Modal
      </button>
      
      <SmartLoginModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        trigger={trigger}
        context={{
          previousAction: 'video_analysis',
          returnUrl: '/dashboard'
        }}
        onSuccess={handleSuccess}
        onCancel={() => console.log('Login cancelled')}
        onSkip={() => console.log('Login skipped')}
      />
    </>
  );
}
```

## Props

### SmartLoginModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls modal visibility |
| `onOpenChange` | `(open: boolean) => void` | ✅ | Callback when modal state changes |
| `trigger` | `LoginTrigger` | ❌ | Defines the context and urgency of the login prompt |
| `context` | `LoginContext` | ❌ | Additional context for the login action |
| `onSuccess` | `(result: any) => void` | ❌ | Callback when login succeeds |
| `onCancel` | `() => void` | ❌ | Callback when user cancels login |
| `onSkip` | `() => void` | ❌ | Callback when user skips login (if allowed) |

### LoginTrigger

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'trial_exhausted' \| 'feature_required' \| 'save_action' \| 'premium_feature'` | The reason for showing the login modal |
| `message` | `string` | Custom message to display to the user |
| `urgency` | `'low' \| 'medium' \| 'high'` | Visual urgency level (affects styling) |
| `allowSkip` | `boolean` | Whether the user can skip the login |

### LoginContext

| Property | Type | Description |
|----------|------|-------------|
| `previousAction` | `string` | The action that triggered the login prompt |
| `returnUrl` | `string` | URL to redirect to after successful login |
| `metadata` | `any` | Additional context data |

## Trigger Types

### 1. Trial Exhausted
```tsx
{
  type: 'trial_exhausted',
  message: 'You\'ve used all 5 free analysis requests. Sign in to continue.',
  urgency: 'high',
  allowSkip: false
}
```

### 2. Feature Required
```tsx
{
  type: 'feature_required',
  message: 'This feature requires an account to save your progress.',
  urgency: 'medium',
  allowSkip: true
}
```

### 3. Save Action
```tsx
{
  type: 'save_action',
  message: 'Sign in to save this analysis report.',
  urgency: 'low',
  allowSkip: true
}
```

### 4. Premium Feature
```tsx
{
  type: 'premium_feature',
  message: 'Advanced features are available for registered users.',
  urgency: 'medium',
  allowSkip: true
}
```

## Accessibility Features

- **Focus Management**: Automatically focuses the modal when opened and returns focus when closed
- **Keyboard Navigation**: ESC key closes the modal, Tab navigation works properly
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: High contrast colors for all text and interactive elements
- **Touch Targets**: Buttons are properly sized for touch interaction

## Styling

The component uses Tailwind CSS classes and adapts its appearance based on the urgency level:

- **High Urgency**: Red accent colors and overlay
- **Medium Urgency**: Orange accent colors and overlay  
- **Low Urgency**: Blue accent colors and standard overlay

## Animation

The modal includes smooth enter/exit animations:
- Fade in/out for the overlay
- Scale and slide animations for the modal content
- Loading spinners for login buttons during authentication

## Testing

A test page is available at `/test-smart-modal` to try different trigger types and configurations.

## Requirements Fulfilled

This component fulfills all the requirements from task 7:

1. ✅ **Created SmartLoginModal.tsx component** - Complete modal component implementation
2. ✅ **Uses Radix UI Dialog** - Built on `@radix-ui/react-dialog` for accessibility
3. ✅ **Visual layout and animations** - Smooth animations with urgency-based styling
4. ✅ **Open/close state management** - Proper state handling with callbacks
5. ✅ **Keyboard navigation and focus management** - ESC key, focus trapping, and proper ARIA support

The component is ready for integration with the smart authentication system and can be used across the application for different login scenarios.