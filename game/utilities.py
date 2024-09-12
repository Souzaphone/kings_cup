import numpy as np

# Helper function to generate skewed numbers for target values
def generate_random_integer(mu=2.2, sigma=0.15, mode_target=15):
    random_number = np.random.lognormal(mu, sigma)
    
    mode_actual = np.exp(mu - sigma**2)
    scaling_factor = mode_target / mode_actual
    
    random_integer = int(np.round(random_number * scaling_factor))
    
    return random_integer