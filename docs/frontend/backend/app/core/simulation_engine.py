# simulation_engine.py
import random

def simulate_season(num_pa, probabilities):
    # Event types from probability_model: "HR", "2B", "1B", "BB", "HBP", "K", "IPO"
    outcomes = {
        "HR": 0, "2B": 0, "1B": 0, "BB": 0, "HBP": 0, "K": 0, "IPO": 0,
        "H": 0, "AB": 0, "PA": 0, "OUT": 0 # Aggregate OUT for convenience if needed
    }
    # Define the order for resolving random outcomes based on cumulative probability
    # HBP and BB are often resolved first by some models, but here order matters for cumulative sum.
    # Make sure all keys in 'probabilities' are in event_order.
    event_order = ["HR", "2B", "1B", "BB", "HBP", "K", "IPO"]
    # Verify probabilities sum to ~1.0 (can add a check here if needed)

    for _ in range(num_pa):
        outcomes["PA"] += 1
        rand_val = random.random()
        cumulative_prob = 0.0
        chosen_event = None # Should always be set

        for event_type in event_order:
            prob = probabilities.get(event_type, 0)
            cumulative_prob += prob
            if rand_val < cumulative_prob:
                chosen_event = event_type
                break
        
        if chosen_event is None: # Fallback if something went wrong with probabilities
            chosen_event = "IPO" # Default to an out

        outcomes[chosen_event] += 1

        # Update aggregate stats based on the event
        if chosen_event in ["HR", "2B", "1B"]:
            outcomes["H"] += 1
            outcomes["AB"] += 1
        elif chosen_event == "K" or chosen_event == "IPO":
            outcomes["OUT"] += 1 # Store aggregate outs
            outcomes["AB"] += 1
        elif chosen_event == "BB" or chosen_event == "HBP":
            # Not an AB
            pass
        # Any other event types would need rules here

    return outcomes

def calculate_sim_stats(sim_results):
    stats = {}
    ab = sim_results.get("AB",0); h = sim_results.get("H",0); bb = sim_results.get("BB",0)
    hbp = sim_results.get("HBP",0); pa = sim_results.get("PA",0)
    k = sim_results.get("K", 0) # Get strikeouts

    stats["BA"] = h / ab if ab > 0 else 0
    stats["OBP"] = (h + bb + hbp) / pa if pa > 0 else 0
    
    # Triple-Base Hits (3B) are currently not modeled, assumed to be part of 1B or 2B counts implicitly.
    # If 3B were modeled, tb calculation would include them.
    tb = (sim_results.get("1B",0) * 1 +
          sim_results.get("2B",0) * 2 +
          sim_results.get("HR",0) * 4)
    stats["SLG"] = tb / ab if ab > 0 else 0
    stats["OPS"] = stats["OBP"] + stats["SLG"]
    stats["K_rate"] = k / pa if pa > 0 else 0 # Strikeout rate
    stats["BB_rate"] = bb / pa if pa > 0 else 0 # Walk rate

    # Return counts needed for error calculation and display
    stats["HR_count"] = sim_results.get("HR",0)
    stats["BB_count"] = sim_results.get("BB",0)
    stats["K_count"] = k # Explicitly K count
    stats["H_count"] = h
    stats["AB_count"] = ab
    stats["PA_count"] = pa
    stats["_1B_count"] = sim_results.get("1B",0)
    stats["_2B_count"] = sim_results.get("2B",0)
    # The "OUT" in sim_results is K + IPO.
    # For error calculation against target "OUT", target OUT needs to be comparable.
    # Target OUT is typically PA - H - BB - HBP.
    # Simulated OUT is K + IPO. The sum K+IPO should match PA_sim - H_sim - BB_sim - HBP_sim.
    stats["OUT_count"] = sim_results.get("OUT",0) # This is K + IPO

    return stats