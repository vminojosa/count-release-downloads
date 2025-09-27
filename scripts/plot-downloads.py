import pandas as pd
from plotnine import ggplot, aes, geom_point, geom_line, geom_hline, geom_vline, element_rect, element_text, element_line, annotate, scale_y_continuous, scale_x_date, element_text, labs, theme, theme_minimal, theme_linedraw
import datetime
import os

def readyData():
    # Load the CSV data
    filenames = [f for f in os.listdir("csv")]

    DFs = []

    # Convert the 'Month' column to datetime
    for file in filenames:
        DF = pd.read_csv(f'csv/{file}')
        DF['Month'] = pd.to_datetime(DF['Month'], format='%Y-%m')
        DF['Package']=file
        DFs.append(DF)
    
    data = pd.concat(DFs, axis=0)

    return data

# Create the plot
def exportGraph(data):
    plot = (
        ggplot(data, aes(x='Month', y='Downloads', color='Package')) +
        geom_line() +
        geom_vline(xintercept=max(data['Month']), color='black', linetype="dotted") +
        geom_vline(color='blue', xintercept="2027-08-01") +
        annotate('text', x="2024-01-01", y=50, label='Goal of 50 contributors', color='green', angle=0, va='bottom', ha='right') +
        geom_hline(yintercept=50, color='green') +
        scale_y_continuous(limits=[0, 23000]) +
        scale_x_date(limits=["2015-08-01", "2028-01-01"], expand=(0,0), date_labels="%Y", name="Time") +
        labs(title='Downloads in the Past Year', x='Month', y='Number of Downloads') +
        theme_linedraw() +
        theme(
            plot_background=element_rect(fill='white', color='white'),
            panel_background=element_rect(fill='#FAFAFA'),
            panel_border=element_rect(color='black'),
            axis_ticks_length=5,
            axis_ticks=element_line(color='white'))
    )
    return plot.save(f'downloads_past_six_months.png')

exportGraph(readyData())