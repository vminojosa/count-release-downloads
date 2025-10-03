import pandas as pd
from plotnine import ggplot, aes, geom_point, geom_line, geom_hline, geom_vline, element_rect, element_text, element_line, annotate, scale_y_continuous, scale_x_date, element_text, labs, theme, theme_minimal, theme_linedraw
import datetime
import os

def readyData():
    # Load the CSV data
    filenames = [f for f in os.listdir("../csv_tests")]

    DFs = []

    # Convert the 'Month' column to datetime
    for file in filenames:
        DF = pd.read_csv(f'../csv_tests/{file}')
        DF['Month'] = pd.to_datetime(DF['Month'], format='%Y-%m')
        DF['Package']=file.replace("-data.csv"," ")
        DFs.append(DF)
    
    data = pd.concat(DFs, axis=0)

    return data

data = readyData()

# Create the plot
# Create the plot
def exportGraph(data):
    plot = (
        ggplot(data, aes(x='Month', y='Downloads', color='Package')) +
        geom_line() +
        geom_vline(xintercept=max(data['Month']), color='black', linetype="dotted") +
        scale_y_continuous(limits=[0, 23000]) +
        scale_x_date(limits=["2015-08-01", "2028-01-01"], expand=(0,0), date_labels="%Y", name="Time") +
        labs(title='Downloads in the Previous Month', x='Month', y='Number of Downloads') +
        theme_linedraw() +
        theme(
            plot_background=element_rect(fill='white', color='white'),
            panel_background=element_rect(fill='#FAFAFA'),
            panel_border=element_rect(color='black'),
            axis_ticks_length=5,
            axis_ticks=element_line(color='white'),
            legend_position=(0.20,0.5),
            legend_direction='vertical',
            legend_background=element_rect())
    )
    return plot.save(f'../plots_tests/downloads_past_six_months.png')

exportGraph(data)