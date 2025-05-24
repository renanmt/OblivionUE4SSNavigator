// This runs on the client
export const handleError = ({ error, event }) => {
    console.error('Client error:', error);
    return {
        message: 'An unexpected error occurred.'
    };
}; 